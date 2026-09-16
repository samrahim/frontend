import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  split,
  Observable,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

// ✅ الاستيراد الصحيح عبر Named Import
import { createUploadLink } from "apollo-upload-client";

import { auth } from "../firebase";

const BACKEND_URL =
  import.meta.env.VITE_GRAPHQL_URL || "http://localhost:8081/query";

const BACKEND_WS_URL = BACKEND_URL.replace(/^http/, "ws");
export const UPLOAD_URL = BACKEND_URL.replace("/query", "");

const getFreshToken = async (): Promise<string | null> => {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      console.log("token-----------", token);
      localStorage.setItem("authToken", token);
      return token;
    } catch {
      return localStorage.getItem("authToken");
    }
  }
  return localStorage.getItem("authToken");
};

const authLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    getFreshToken()
      .then((token) => {
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
          },
        }));

        const handle = forward(operation).subscribe({
          next: (result) => observer.next(result),
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });

        return () => {
          if (handle) handle.unsubscribe();
        };
      })
      .catch((error) => observer.error(error));
  });
});

const uploadHttpLink = (createUploadLink as any)({
  uri: BACKEND_URL,
  credentials: "omit",
});

export const wsClient = createClient({
  url: BACKEND_WS_URL,
  connectionParams: async () => {
    const token = await getFreshToken();

    return {
      authorization: token ? `Bearer ${token}` : "",
    };
  },
  retryAttempts: 5,
  shouldRetry: () => true,
});

wsClient.on("connected", () => {
  console.log("🟢 تم الاتصال بالخادم بنجاح (WebSocket Stream Active)");
});

wsClient.on("closed", (event) => {
  console.log("🔴 تم قطع الاتصال بالخادم:", event);
});

wsClient.on("error", (error) => {
  console.error("⚠️ حدث خطأ في اتصال الـ WebSocket:", error);
});

const wsLink = new GraphQLWsLink(wsClient);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(uploadHttpLink as any)
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/graphql/schema.graphql",
  documents: "./src/graphql/operations/**/*.graphql",
  generates: {
    "./src/graphql/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        skipTypename: false,
        withHooks: true,
        withComponent: false,
        apolloReactHooksImportFrom: "@apollo/client",
        useIndexSignature: true,
        dedupeFragments: true,
      },
    },
  },
};

export default config;

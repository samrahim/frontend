/// <reference types="vite/client" />

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.sass" {
  const content: string;
  export default content;
}

declare module "*.less" {
  const content: string;
  export default content;
}

declare module "*.styl" {
  const content: string;
  export default content;
}

declare module "apollo-upload-client" {
  import { ApolloLink } from "@apollo/client";
  export function createUploadLink(options?: any): ApolloLink;
  export default function createUploadLink(options?: any): ApolloLink;
}

declare module "apollo-upload-client/createUploadLink.mjs" {
  import { ApolloLink } from "@apollo/client";
  export default function createUploadLink(options?: any): ApolloLink;
}

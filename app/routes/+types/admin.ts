import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export namespace Route {
  export type ActionArgs = ActionFunctionArgs;
  export type LoaderArgs = LoaderFunctionArgs;
}
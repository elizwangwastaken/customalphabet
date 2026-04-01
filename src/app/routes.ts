import { createHashRouter } from "react-router";
import CreatePage from "./components/CreatePage";
import DisplayPage from "./components/DisplayPage";

export const router = createHashRouter([
  {
    path: "/",
    Component: CreatePage,
  },
  {
    path: "/display",
    Component: DisplayPage,
  },
]);

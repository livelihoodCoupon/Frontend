import { Platform } from "react-native";
import WebSearchOptionsComponent from "./SearchOptionsComponent.web";
import MobileSearchOptionsComponent from "./SearchOptionsComponent.mobile";
import React from "react";
import { SearchOptions } from "../../types/search";

interface Props {
  searchOptions: SearchOptions;
  setSearchOptions: (options: Partial<SearchOptions>) => void;
}

const SearchOptionsComponent: React.FC<Props> = (props) => {
  if (Platform.OS === "web") {
    return <WebSearchOptionsComponent {...props} />;
  }
  return <MobileSearchOptionsComponent {...props} />;
};

export default SearchOptionsComponent;

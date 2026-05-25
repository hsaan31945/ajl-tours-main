import React from "react";

const ButtonHome2 = ({ children, ...props }) => {
  return (
    <button {...props} className={"button-31 " + (props.className || "")}>{children}</button>
  );
};

export default ButtonHome2; 
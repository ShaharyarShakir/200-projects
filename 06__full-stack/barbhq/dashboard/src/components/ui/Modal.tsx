import React from "react";
import { Dialog, type DialogProps } from "./dialog";

export type ModalProps = DialogProps;

export const Modal: React.FC<ModalProps> = (props) => {
  return <Dialog {...props} />;
};

import React, { useState } from "react";
import Modal from "../ui/modal";

const ViewTaskModal = () => {
  const [open, setOpen] = useState(false);
  return (
    <Modal
      className="max-w-xl"
      id="view-tasks-modal"
      isOpen={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      <Modal.Header>
        <h1>View Tasks</h1>
      </Modal.Header>

      <Modal.Body>
        <div></div>
      </Modal.Body>
    </Modal>
  );
};

export default ViewTaskModal;

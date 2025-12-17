import React from "react";
import Modal from "../ui/modal";
import { Button } from "../ui/button";

const SelectSignUpType = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <Modal
      id="select-signup-type-modal"
      isOpen={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      className="max-w-md"
    >
      <Modal.Body className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-xl text-muted-foreground">Select Sign up type</h2>
          <Button
            variant={"outline"}
            size={"sm"}
            onClick={() => setOpen(false)}
          >
            x
          </Button>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center">
          <a
            href="/register-volunteer"
            className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 w-fit p-4"
          >
            Sign Up as Volunteer
          </a>
          <a
            href="/register-agency"
            className="w-fit text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 p-4"
          >
            Sign Up as Government Organization or Agency
          </a>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SelectSignUpType;

import React from 'react'
import Modal from '../ui/modal'

const SelectSignUpType = () => {
    const [open, setOpen] = React.useState(true);
  return (
    <Modal
      id="select-signup-type-modal"
      isOpen={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}>
        <Modal.Header>Select Sign Up Type</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <a
              href="/register-volunteer"
              className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300"
            >
              Sign Up as Volunteer
            </a>
            <a
              href="/register-agency"
              className="w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300"
            >
              Sign Up as Agency
            </a>
          </div>
        </Modal.Body>

    </Modal>
  )
}

export default SelectSignUpType
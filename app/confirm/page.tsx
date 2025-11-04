import ConfirmEmailPage from '@/parts/confirm'
import React, { Suspense } from 'react'

const ConfirmScreen = () => {
  return (
    <div>
      <Suspense>
        <ConfirmEmailPage/>
      </Suspense>
    </div>
  )
}

export default ConfirmScreen;
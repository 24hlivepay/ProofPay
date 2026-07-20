import { createContext, useContext, useState } from "react";

/*
   Ye hamara global context hai.
   Isme escrow ki sari information store hogi.
*/

const EscrowContext = createContext();

/*
   Ye component poori app ko data provide karega.
*/

export function EscrowProvider({ children }) {

  const [escrowData, setEscrowData] = useState({

    buyerName: "",

    sellerName: "",

    productName: "",

    productId: "",

    amount: "",

    description: "",

    expiry: "",

    escrowId: "",

    verificationCode: ""

  });

  return (

    <EscrowContext.Provider
      value={{
        escrowData,
        setEscrowData,
      }}
    >

      {children}

    </EscrowContext.Provider>

  );

}

/*
   Ye custom hook hai.
   Kisi bhi page se sirf

   const { escrowData } = useEscrow();

   likh kar data mil jayega.
*/

export function useEscrow() {
  return useContext(EscrowContext);
}
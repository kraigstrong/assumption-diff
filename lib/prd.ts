/**
 * The PRD under review. Deliberately short and deliberately underspecified --
 * it reads as complete, which is exactly the problem the demo illustrates.
 */
export const PRD = {
  title: "Account Deletion",
  author: "Product",
  body: `Customers need to be able to delete their account.

Today, users who want to leave have to email support, which takes 3-5 days and
generates a steady trickle of tickets. Several enterprise prospects have raised
this during security review, and our upcoming compliance audit expects a
self-serve path.

Users should be able to delete their account from Settings without contacting
support. The flow should confirm intent, explain what happens, and complete
without manual intervention. Once deleted, the user's data should be removed
and they should receive an email confirmation.

Success: support tickets for deletion drop to near zero, and the flow completes
in under a minute.`,
} as const;

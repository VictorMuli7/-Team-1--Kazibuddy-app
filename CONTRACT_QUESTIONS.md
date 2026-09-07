Upstream Partner - HospitalQ (Team 13)
No error responses are documented anywhere in the spec. Every endpoint only shows a success response. There is nothing for bad input, missing or invalid auth, or an unknown department id. 
The auth model on the login endpoint is unclear. It does not say whether this is one shared login for the whole app or a separate login per user, there is no token expiry or refresh info, and it does not say which role is actually required to create a ticket or view analytics.
Ticket numbering and queue order are not defined. It does not say whether the ticket number resets every day, resets per department, or just keeps counting up forever. It also does not say what order the queue list comes back in, or whether an urgent ticket jumps ahead of others.

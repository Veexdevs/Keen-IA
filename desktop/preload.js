/**
 * Nothing is injected into the page.
 *
 * The interface is the same web app the browser runs, and it needs no bridge
 * to the desktop process: everything it does — accounts, chats, connectors —
 * goes through its own HTTP routes. Keeping this file empty on purpose means
 * a compromised page has no handle into Node.
 */

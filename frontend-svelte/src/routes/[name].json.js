/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({params}) {
  const {name} = params;

  return {
    body: {
      greetings: `Hello, ${name}`
    }
  }
}

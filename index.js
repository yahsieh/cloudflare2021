import { Router } from 'itty-router'

// Create a new router
const router = Router()

router.get("/", async () => {
  return new Response("")
})

router.get("/writeToExample", async () => {
  await MY_KV.put('examplePost',
    '[{"title":"My First Post", "username": "coolguy123", "content": "Hey Y\'all!"},'
  + '{"title":"Story About my Dogs", "username": "kn0thing", "content": "So the other day I was in the yard, and..."}]')
  return new Response("write success!")
})

/*
This route demonstrates path parameters, allowing you to extract fragments from the request
URL.
Try visit /example/hello and see the response.
*/
router.get("/example/:text", ({ params }) => {
  // Decode text like "Hello%20world" into "Hello world"
  let input = decodeURIComponent(params.text)

  // Construct a buffer from our input
  let buffer = Buffer.from(input, "utf8")

  // Serialise the buffer into a base64 string
  let base64 = buffer.toString("base64")

  // Return the HTML with the string to the client
  return new Response(`<p>Base64 encoding: <code>${base64}</code></p>`, {
    headers: {
      "Content-Type": "text/html"
    }
  })
})

/*
This shows a different HTTP method, a POST.
Try send a POST request using curl or another tool.
Try the below curl command to send JSON:
$ curl -X POST <worker> -H "Content-Type: application/json" -d '{"abc": "def"}'
*/
router.get("/posts", async () => {
  let returnData = await MY_KV.get('examplePost')
  return new Response(returnData, {
    headers: {
      "Content-Type": "application/json"
    }
  })
})

router.post("/posts", async request => {
  // Create a base object with some fields.
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response("syntax error", {status: 400})
  }
  let oldPosts = await MY_KV.get('posts', {type: "json"})
  let reqData = await request.json()
  oldPosts.push(reqData[0])
  // Serialise the JSON to a string.
  const post = JSON.stringify(oldPosts, null, 2)
  console.log(post)
  await MY_KV.put('posts', post)
  return new Response("write success")
})

router.post("/delete", async request => {
  // Create a base object with some fields.
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response("syntax error", {status: 400})
  }
  let oldPosts = await MY_KV.get('posts', {type: "json"})
  let reqData = await request.json()
  oldPosts.push(reqData[0])
  // Serialise the JSON to a string.
  const post = JSON.stringify(oldPosts, null, 2)
  console.log(post)
  await MY_KV.put('posts', post)
  return new Response("write success")
})

router.get("/list", async () => {
  let returnData = await MY_KV.get('posts')
  return new Response(returnData, {
    headers: {
      "Content-Type": "application/json"
    }
  })
})

router.get("/clearall", async () => {
  await MY_KV.put('posts', '[]')
  return new Response("delete success")
})


/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).
Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all("*", () => new Response("404, not found!", { status: 404 }))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
})
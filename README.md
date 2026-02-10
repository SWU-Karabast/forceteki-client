# Forceteki-client
Web client for use with the forceteki engine.

We have a [Discord server](https://discord.gg/N6ZgcZ3SfA) for updates, bug reports, and coordinating dev work.

### Contributing
For details on how to get started, see the [wiki](https://github.com/SWU-Karabast/forceteki/wiki). Client issues are tracked on this repo's [issues page](https://github.com/SWU-Karabast/forceteki-client/issues) — look for the `good first issue` label for beginner-friendly tasks.

## Development Quickstart
Follow these instructions to get to the point of being able to run client and connect to a default game. These instruction assume you have a [server](https://github.com/SWU-Karabast/forceteki/wiki) running locally.

#### Required Software
* Git
* Node.js v22.x

### Install Dependencies
The following demonstrates how to install dependencies and run the client server.

```bash
# install node dependencies
npm install
npm run dev
```

Once this is running you can go to http://localhost:3000 to get to the home page. Testing with real games requires setting up the BE repo and running the server, see full instructions for that at this wiki: https://github.com/SWU-Karabast/forceteki/wiki/Client-&-Server-Setup

### Mobile Testing and Custom Environment

For testing on mobile devices connected to your local network:

1. Copy `.env.local.example` to `.env.local`
2. Edit `.env.local` and replace `your-local-ip` with your computer's IP address (e.g., `192.168.4.40`)
3. Restart the development server
4. Follow the [backend mobile testing instructions](https://github.com/SWU-Karabast/forceteki#mobile-testing-and-custom-environment) to add your IP to the CORS allowed origins
5. Connect to `your-local-ip:3000` on the web browser of your mobile device

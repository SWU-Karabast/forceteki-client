# Forceteki-client
Web client for use with the forceteki engine.

We have a [Discord server](https://discord.gg/N6ZgcZ3SfA) for updates, bug reports, and coordinating dev work.

### Contributing
For details on how to get started adding cards, see the [wiki](https://github.com/SWU-Karabast/forceteki/wiki).

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

Once this is running you can go to http://localhost:3000 to get to the home page. 

To start a game with 2 players open one tab to http://localhost:300/Gameboard and another tab to http://localhost:3000/GameBoard?player=ThisIsTheWay

The state updater is currently set to log game state updates to the console as they are received. 
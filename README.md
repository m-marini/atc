
![Node.js CI](https://github.com/m-marini/atc/workflows/Node.js%20CI/badge.svg) ![Deploy](https://github.com/m-marini/atc/workflows/Deploy/badge.svg)

The game is based on the ATC Game for Linux by Ed James, UC Berkleey: [edjames@ucbvax.berkeley.edu](mailto:edjames@ucbvax.berkeley.edu), ucbvax!edjames.

## GOAL.

Your goal is to route safely the planes in your area.
You need to:

- take off planes waiting at runways
- land the planes at destination runways
- fly the planes via the leaving beacons at altitude of 36000 feet.

You must avoid:

- planes collinsion, the collision happend when the distance between two planes
  are lower then 4 nautic miles and the altitude difference is lower then 1000 feet
- leaving to a wrong beacons
- landing to a wrong runway

You can zoom the map using the mouse wheel and the shift key or move the map by dragging it with the left mouse button.
A click with the center mouse button fits the map to the viewport.

[Select for more help](https://github.com/m-marini/atc/wiki)

[Web game](http://www.mmarini.org/atc)

### Author

Marco Marini

[marco.marini@mmarini.org](mailto:marco.marini@mmarini.org)
[http://www.mmarini.org](http://www.mmarini.org)

## Project

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

To create the code coverage report launch:
```
npm run test -- --coverage --watchAll=false
```

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify

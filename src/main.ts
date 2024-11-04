import "./style.css";
const map: HTMLDivElement = document.querySelector("#map");

const button = document.createElement("button");
button.innerHTML = "Click me";
button.addEventListener("click", () => {
  //I want it to say you clicked me on the screen
  document.body.innerHTML = "You clicked me";
});
map.append(button);

import "./style.css";
const map: HTMLDivElement = document.querySelector("#map")!;

//button placement for workability
const button = document.createElement("button");
button.innerText = "Click me";
button.id = "button";
button.addEventListener("click", () => {
  button.innerText = "You clicked me";
});
map.append(button);

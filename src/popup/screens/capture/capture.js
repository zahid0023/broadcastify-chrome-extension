document.addEventListener('DOMContentLoaded', renderUI);

const startBtn = document.getElementById("startBtn");
const cancelStopBtns = document.getElementById("cancelStopBtns");
const stopBtn = document.getElementById("stopBtn");
const cancelBtn = document.getElementById("cancelBtn")

function renderUI() {
    console.log("UI");

    // Initial State
    cancelStopBtns.style.display = "none";

    // Bind Click Events
    startBtn.addEventListener("click", onClickStart);
    cancelBtn.addEventListener("click", onClickCancel);
    stopBtn.addEventListener("click", onClickStop);
}

function onClickStart() {
    startBtn.style.display = "none";
    cancelStopBtns.style.display = "flex";
}

function onClickCancel() {
    cancelStopBtns.style.display = "none";
    startBtn.style.display = "block";
}

function onClickStop() {
    cancelStopBtns.style.display = "none";
    startBtn.style.display = "block";
}
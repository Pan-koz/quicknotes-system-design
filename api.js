const API_URL = "https://jsonplaceholder.typicode.com/posts";
const loadButton = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
let notes = [];
const pendingDeletes = new Set();

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status${type ? ` ${type}` : ""}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
  });
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}.`);
  if (response.status === 204) return { data: null, status: response.status };
  return { data: await response.json(), status: response.status };
}

function renderNotes() {
  notesList.replaceChildren();
  if (!notes.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No notes to display yet. Load notes or create one.";
    notesList.append(empty);
    return;
  }
  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note";
    const title = document.createElement("h3");
    title.textContent = note.title || "(Untitled note)";
    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = pendingDeletes.has(note.id) ? "Deleting..." : "Delete";
    del.disabled = pendingDeletes.has(note.id);
    del.addEventListener("click", () => deleteNote(note.id));
    item.append(title, body, del);
    notesList.append(item);
  }
}

async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...");
  try {
    const { data } = await request(`${API_URL}?_limit=10`);
    notes = Array.isArray(data) ? data : [];
    renderNotes();
    setStatus(notes.length ? `Loaded ${notes.length} notes from the server.` : "No notes were returned by the server.", "success");
  } catch (error) {
    setStatus(`Could not load notes. ${error.message}`, "error");
    notesList.replaceChildren();
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Notes could not be loaded. Please try again.";
    notesList.append(empty);
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title) { setStatus("Please enter a title.", "error"); titleInput.focus(); return; }
  if (title.length > 100) { setStatus("The title must be 100 characters or fewer.", "error"); titleInput.focus(); return; }
  submitButton.disabled = true;
  setStatus("Creating note...");
  try {
    const { data, status } = await request(API_URL, { method: "POST", body: JSON.stringify({ title, body, userId: 1 }) });
    // JSONPlaceholder simulates writes; it does not persist created posts. Keep this item in local page state only.
    notes = [{ ...data, title, body }, ...notes];
    renderNotes();
    setStatus(`Note created (status ${status}, id ${data.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus(`Could not create note. ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id) {
  if (pendingDeletes.has(id)) return;
  pendingDeletes.add(id); renderNotes(); setStatus("Deleting note...");
  try {
    const { status } = await request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
    notes = notes.filter((note) => note.id !== id);
    setStatus(`Note removed from this page (status ${status}).`, "success");
    // JSONPlaceholder simulates DELETE too; the change is reflected locally, not stored remotely.
  } catch (error) {
    setStatus(`Could not delete note. ${error.message}`, "error");
  } finally {
    pendingDeletes.delete(id);
    renderNotes();
  }
}
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
renderNotes();

import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState(""); // still used by the old Add button (kept for now)
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  //function to toggle expand
  const toggleExpand = (id) => {
  setExpandedTaskId(expandedTaskId === id ? null : id);
};

  // Modal state (Step 1)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");

  // Fetch tasks
  useEffect(() => {
    fetch("http://localhost:8080/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  // Delete task
  const deleteTask = async (id) => {
    try {
      await fetch(`http://localhost:8080/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
// Toggle completed state and persist to backend
const toggleCompleted = async (id) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const updatedTask = { ...task, completed: !task.completed };

  try {
    const res = await fetch(`http://localhost:8080/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    });

    if (res.ok) {
      const saved = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? saved : t))
      );
    }
  } catch (error) {
    console.error("Error updating task:", error);
  }
};

  // (Existing) Add task — we’ll rewire this to the modal in a later step
  const addTask = () => {
    if (!newTask.trim()) return;
    fetch("http://localhost:8080/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask,
        description: "Added from React UI",
        completed: false,
      }),
    })
      .then((res) => res.json())
      .then((task) => setTasks((prev) => [...prev, task]));
    setNewTask("");
  };

  // Add these new states at the top of your component
const [modalHour, setModalHour] = useState("7");
const [modalMinute, setModalMinute] = useState("00");
const [modalAmPm, setModalAmPm] = useState("AM");

// Handle modal create
const createTaskFromModal = () => {
  if (!modalTitle.trim()) return;

  const timeString = `${modalHour}:${modalMinute} ${modalAmPm}`;
  const finalTitle = `${modalTitle} ${timeString}`;

  fetch("http://localhost:8080/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: finalTitle,
      description: modalDescription || "No description",
      completed: false,
    }),
  })
    .then((res) => res.json())
    .then((task) => {
      setTasks((prev) => [...prev, task]);
      setShowModal(false);
      setModalTitle("");
      setModalDescription("");
      setModalHour("7");
      setModalMinute("00");
      setModalAmPm("AM");
    });
};

  // Simple inline styles for our custom modal

  const modalStyles = {
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "16px",
    },
    panel: {
      background: "#fff",
      width: "100%",
      maxWidth: "520px", // smaller than your task list container
      borderRadius: "12px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      padding: "20px",
    },
  };


/*const toggleCompletedLocal = (id) => {
  setTasks(prev =>
    prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
  );
};
*/


  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">
        <span role="img" aria-label="clipboard">📋</span> Task Manager
      </h2>

      {/* Launcher input + Add button (input opens modal on click) */}
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter a new task..."
          onClick={() => setShowModal(true)}
          onFocus={() => setShowModal(true)}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button className="btn btn-primary" onClick={addTask}>
          <span className="me-1">➕</span>Add
        </button>
      </div>

      {/* Task List */}
<ul className="list-group">
  {tasks.map((task) => {
    const isExpanded = expandedTaskId === task.id;

    const words = task.description ? task.description.split(" ") : [];
    const preview =
      words.length > 3 ? words.slice(0, 3).join(" ") + "..." : task.description;

    return (
      <li
        key={task.id}
        className="list-group-item task-item"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          // keep your expand/collapse behavior
          if (e.target.tagName !== "BUTTON") toggleExpand(task.id);
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-start">
            {/* ✅ Checkbox (UI-only for now) */}
            <input
              type="checkbox"
              className="form-check-input me-2 mt-1"
              checked={task.completed}
              onChange={() => toggleCompleted(task.id)}
              onClick={(e) => e.stopPropagation()} // don't trigger expand
            />

            {/* Title + preview */}
            <div>
              <div className={`task-title ${task.completed ? "completed" : ""}`}>
                {task.title}{" "}
                {task.completed ? (
                  <span className="badge bg-success ms-2">Done</span>
                ) : (
                  <span className="badge bg-warning text-dark ms-2">Pending</span>
                )}
              </div>
              <small className="text-muted">{preview}</small>
            </div>
          </div>

          {/* Delete button */}
          <button
            className="btn btn-sm btn-danger"
            onClick={() => deleteTask(task.id)}
            title="Delete task"
          >
            🗑️ Delete
          </button>
        </div>

        {/* Expanding full description (your existing block) */}
        <div className={`collapse-description ${isExpanded ? "show" : ""}`}>
          <p className="mt-2 mb-0">{task.description}</p>
        </div>
      </li>
    );
  })}
</ul>


      {/* STEP 1: Minimal custom Modal */}
      {showModal && (
        <div
          style={modalStyles.backdrop}
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={modalStyles.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="mb-3 text-center">Create a Task</h5>

            {/* Title */}
            <div className="mb-3">
              <label className="form-label">Task</label>
              <input
                autoFocus
                type="text"
                className="form-control"
                placeholder="Task"
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="mb-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Brief description"
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
              />
            </div>


            {/* Time selection */}
{/* Time selection */}
<div className="mb-3 text-center">
  <label className="form-label d-block">Time</label>
  <div className="d-flex justify-content-center align-items-center gap-2">

    {/* Hour wheel */}
    <select
      className="form-select w-auto"
      value={modalHour}
      onChange={(e) => setModalHour(e.target.value)}
    >
      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>

    {/* Minute wheel */}
    <select
      className="form-select w-auto"
      value={modalMinute}
      onChange={(e) => setModalMinute(e.target.value)}
    >
      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
        <option key={m} value={m.toString().padStart(2, "0")}>
          {m.toString().padStart(2, "0")}
        </option>
      ))}
    </select>

    {/* AM/PM selector */}
    <select
      className="form-select w-auto"
      value={modalAmPm}
      onChange={(e) => setModalAmPm(e.target.value)}
    >
      <option>AM</option>
      <option>PM</option>
    </select>
  </div>
</div>



            <div className="d-flex justify-content-center gap-2 mt-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={createTaskFromModal}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState(""); 
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Sorting
  const [sortOrder, setSortOrder] = useState("default"); // "default" | "asc" | "desc"
  const [originalTasks, setOriginalTasks] = useState([]); // to preserve default order

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalHour, setModalHour] = useState("7");
  const [modalMinute, setModalMinute] = useState("00");
  const [modalAmPm, setModalAmPm] = useState("AM");
  const [editTaskId, setEditTaskId] = useState(null);

  // Expand toggle
  const toggleExpand = (id) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // Fetch tasks
  useEffect(() => {
    fetch("http://localhost:8080/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setOriginalTasks(data); // keep original order
      });
  }, []);

  // Delete task
  const deleteTask = async (id) => {
    try {
      await fetch(`http://localhost:8080/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setOriginalTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Toggle completed state
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
        setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)));
        setOriginalTasks((prev) => prev.map((t) => (t.id === id ? saved : t)));
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Add task
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
      .then((task) => {
        setTasks((prev) => [...prev, task]);
        setOriginalTasks((prev) => [...prev, task]);
      });
    setNewTask("");
  };

  // Create task from modal
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
        setOriginalTasks((prev) => [...prev, task]);
        closeModal();
      });
  };

  // Edit task handler (open modal with task data)
  const editTask = (task) => {
    const [taskName, taskTime] = task.title.split(/ (\d{1,2}:\d{2} (AM|PM))$/);
    let hour = "7", minute = "00", ampm = "AM";

    if (taskTime) {
      const [hm, ap] = taskTime.split(" ");
      [hour, minute] = hm.split(":");
      ampm = ap;
    }

    setEditTaskId(task.id);
    setModalTitle(taskName);
    setModalDescription(task.description);
    setModalHour(hour);
    setModalMinute(minute);
    setModalAmPm(ampm);
    setShowModal(true);
  };

  // Update task
  const updateTaskFromModal = () => {
    if (!modalTitle.trim()) return;

    const timeString = `${modalHour}:${modalMinute} ${modalAmPm}`;
    const finalTitle = `${modalTitle} ${timeString}`;

    const updatedTask = {
      title: finalTitle,
      description: modalDescription || "No description",
      completed: tasks.find((t) => t.id === editTaskId)?.completed || false,
    };

    fetch(`http://localhost:8080/tasks/${editTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    })
      .then((res) => res.json())
      .then((saved) => {
        setTasks((prev) => prev.map((t) => (t.id === editTaskId ? saved : t)));
        setOriginalTasks((prev) => prev.map((t) => (t.id === editTaskId ? saved : t)));
        closeModal();
      });
  };

  // Close modal and reset state
  const closeModal = () => {
    setShowModal(false);
    setModalTitle("");
    setModalDescription("");
    setModalHour("7");
    setModalMinute("00");
    setModalAmPm("AM");
    setEditTaskId(null);
  };

  // 🔹 Sorting logic
  const parseTime = (title) => {
    const match = title.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
    if (!match) return null;
    let [_, hour, minute, ampm] = match;
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour * 60 + minute; // minutes since midnight
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortOrder === "default") {
      return originalTasks.findIndex((t) => t.id === a.id) -
             originalTasks.findIndex((t) => t.id === b.id);
    }
    const timeA = parseTime(a.title) ?? 0;
    const timeB = parseTime(b.title) ?? 0;
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });

  // Modal styles
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
      maxWidth: "520px",
      borderRadius: "12px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
      padding: "20px",
    },
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-3">
        <span role="img" aria-label="clipboard">📋</span> Task Manager
      </h2>

      {/* Sorting Dropdown */}
      <div className="d-flex justify-content-center mb-3">
        <select
          className="form-select sort-dropdown"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">Default Order</option>
          <option value="asc">Ascending (by Time)</option>
          <option value="desc">Descending (by Time)</option>
        </select>
      </div>

      {/* Add new task input */}
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
        {sortedTasks.map((task) => {
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
                if (e.target.tagName !== "BUTTON" && e.target.tagName !== "SPAN") toggleExpand(task.id);
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-start">
                  <input
                    type="checkbox"
                    className="form-check-input me-2 mt-1"
                    checked={task.completed}
                    onChange={() => toggleCompleted(task.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
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

                {/* Action buttons */}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      editTask(task);
                    }}
                    title="Edit task"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={`collapse-description ${isExpanded ? "show" : ""}`}>
                <p className="mt-2 mb-0">{task.description}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Modal */}
      {showModal && (
        <div style={modalStyles.backdrop} onClick={closeModal} role="dialog" aria-modal="true">
          <div style={modalStyles.panel} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3 text-center">
              {editTaskId ? "Edit Task" : "Create a Task"}
            </h5>

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
            <div className="mb-3 text-center">
              <label className="form-label d-block">Time</label>
              <div className="d-flex justify-content-center align-items-center gap-2">
                <select
                  className="form-select w-auto"
                  value={modalHour}
                  onChange={(e) => setModalHour(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
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
              <button className="btn btn-outline-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editTaskId ? updateTaskFromModal : createTaskFromModal}
              >
                {editTaskId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

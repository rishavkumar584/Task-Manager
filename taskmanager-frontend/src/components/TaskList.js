import React, { useEffect, useState } from "react";
import { getTasks, addTask } from "../api/taskService";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // Fetch tasks from backend
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const task = { title: newTask, description: "", completed: false };
    const savedTask = await addTask(task);
    if (savedTask) {
      setTasks([...tasks, savedTask]);
      setNewTask("");
    }
  };

  return (
    <div>
      <h2>My Tasks</h2>

      {/* Task Input */}
      <div>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter new task..."
        />
        <button onClick={handleAddTask}>Add</button>
      </div>

      {/* Task List */}
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span style={{ textDecoration: task.completed ? "line-through" : "none" }}>
              {task.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;

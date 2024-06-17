import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.sass";
import { current } from "@reduxjs/toolkit";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const [activeListIndex, setActiveListIndex] = useState(0);
const tabsRef = useRef([]);
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleArrowKeyDown = (event, currentIndex) => {
    let newIndex;
    switch(event.key){
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % lists.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex + lists.length - 1) % lists.length;
        break;
      default:
        return;
    }
    event.preventDefault();
    handleSelectList(lists[newIndex].id);
  }

  useEffect(() => {
    const selectedIndex = lists.findIndex((list) => list.id === selectListId);
    if(tabsRef.current[selectedIndex]){
      tabsRef.current[selectedIndex].focus();
    }
  },[selectListId, lists]);

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" role='tablist'>
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  role='tab'
                  aria-selected={isActive}
                  tabIndex={1}
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => handleArrowKeyDown(e, key)}
                  ref={(el) => tabsRef.current[key] = el}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay == "done") {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                <br />
                {task.done ? "完了" : "未完了"}
                <br />
                {"期限 : " + adjustLimit(task.limit)}
                <br />
                <p className = "limitCaution">
                  {remainingTime(task.limit)}
                </p>
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            >
              {task.title}
              <br />
              {task.done ? "完了" : "未完了"}
              <br />
              {"期限 : " + adjustLimit(task.limit)}
              <br />
              <p className = "limitCaution">
                {remainingTime(task.limit)}
              </p>
            </Link>
          </li>
        ))}
    </ul>
  );
};

const adjustLimit = (limit) => {
  if (limit === null) return "";
  limit = limit.replace("T", " ").replace("Z", "");
  //console.log(limit)
  return limit;
};

const remainingTime = (limit) => {
  limit = adjustLimit(limit);
  limit = limit.split(" ");
  limit = limit[0].split("-") +(",")+ limit[1].split(":");
  limit = limit.split(",");
  let date = new Date();
  let nowTime = (limit[0] - date.getFullYear()) * 365*24*60 + (limit[1] - date.getMonth() - 1) * 30*24*60 + (limit[2] - date.getDate()) * 24*60 + (limit[3] - date.getHours()) * 60 + (limit[4] - date.getMinutes());
  if(nowTime < 0){
    return "期限切れ";
  }else if(nowTime > 365 * 60 * 24){
    return "残り時間 : 1年以上";
  }else if(nowTime > 60 * 24){
    return "残り時間 : 約"+  Math.floor(nowTime / 60 / 24) + "日";
  }else if(nowTime > 60){
    return "残り時間 : 約"+ Math.floor(nowTime / 60 )+ "時間";
  }
  return "残り時間 : " +  nowTime + "分";
}


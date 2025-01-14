import logo from './logo.svg';
import './App.css';
import {useState, useRef, useReducer, useEffect} from 'react'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])

  return (
    <div className="p-4 flex flex-col items-center justify-between min-h-screen xl:mx-44">
      <div className="w-full">
        <div className="text-xl text-center mb-4 flex items-center justify-start">
            <img className="App-logo" src={logo} width={50} alt="logo" />
            <div className="w-auto">
              <div className="">The GitHub Cards App</div>
            </div>
        </div>
        <AddUsersForm setUsers={setUsers} />
        <UsersList setUsers={setUsers} users={users}/>
      </div>
      <small className="text-gray-700 mt-4">&copy; Github cards app</small>
    </div>
  );
}

const Search = ({className, onAction, users}) => {

  const [firstUserDetails, setFirstUserDetails] = useState({});

  const [firstUser = users[0], ...restOfUsers] = users.slice(0, 20);

  useEffect(() => {
    setFirstUserDetails(firstUser)
    const {cancel, token} = axios.CancelToken.source();
    (async () => {
      try {
        const res = await axios.get(`https://api.github.com/users/${firstUser.login}`, {token})
        const data = res.data;
        setFirstUserDetails(data)
      } catch (error) {
        console.log(error)
      }
    })();
    return () => {
      cancel("No longer the latest query")
    }
  }, [firstUser])

    return (
      <div className={className}>
        {firstUserDetails && <div onClick={() => onAction(firstUserDetails)} className="py-2  w-auto h-auto  border-b border-gray-100 cursor-pointer hover:bg-green-200 hover:shadow-inner text-sm text-gray-700 flex" >
            <span className="flex flex-col md:flex-row px-4 h-auto items-start flex-1">
               <img className="" width={60} src={firstUserDetails.avatar_url} alt="github user" />
               <span className="flex flex-col flex-1 mt-2 sm:mt-0 sm:mx-2">
                 <span className="text-sm">{firstUserDetails.name}
                 </span>
                 <span className="text-xs text-gray-500">
                    {`@${firstUserDetails.login}`}
                 </span>
                 <span className="text-xs text-gray-500">
                    {firstUserDetails.company}
                 </span>
               </span>
            </span>
            <span className="text-green-500 font-bold mx-4 text-xs">{`+ Add`}</span>
        </div>}
        {restOfUsers.length > 0 && restOfUsers.map(user => (
           <div onClick={() => onAction(user)} className="py-2  w-auto border-b border-gray-100 cursor-pointer hover:bg-gray-200 hover:shadow-inner text-sm text-gray-700 items-center" key={user.id}>
             <span className="flex h-14 px-4 items-center">
               <img className="rounded-full" width={40} src={user.avatar_url} alt="github user" />
               <span className="text-sm text-gray-500 mx-2">
                  {`@${user.login}`}
               </span>
             </span>
           </div>
        ))}
      </div>
    )
}

function queryReducer(prevResult, action) {
  switch (action.type) {
    case 'start':
      return {
        result: [],
        isError: false,
        message: 'Searching...'
      }
    case 'success':
      return {
        result: action.data,
        isError: false,
        message: ''
      }
    case 'add':
      return {
        result: [],
        isError: false,
        message: 'Adding user...'
      }
    case 'end':
      return {
        result: [],
        isLoading: false,
        isError: false,
        message: ''
      }
    case 'error-404':
      return {
        result: [],
        isError: true,
        message: 'User not found'
      }
    case 'error':
      return {
        result: [],
        isError: true,
        message: 'Something went terribly wrong'
      }
    default:
      throw new Error()
  }
}

const search = async (query, dispatch, cancelToken = "") => {
  dispatch({type: 'start'})
  try {
    const res = await axios.get(`https://api.github.com/search/users?q=${query}`,{cancelToken})
    const users = await res.data.items.splice(0,20);
    if (users.length <= 0) {
      dispatch({type: 'error-404'})
      return;
    }
    dispatch({type: 'success', data: users})
  } catch (err) {
    console.log(err)
    axios.isCancel(err) || dispatch({type: 'error'});
  }
}

function AddUsersForm({setUsers}) {
  const inputRef = useRef();
  const [username, setUsername] = useState('')
  const [{result, isError, message}, dispatch] = useReducer(queryReducer, {result: [], isError: false, isLoading: false, message: ''})

  const handleSearch = () => {
    setUsername(inputRef.current.value)
    if (inputRef.current.value === "") {
      dispatch({type: "end"})
    }
  }

  useEffect(() => {
    const {cancel, token} = axios.CancelToken.source();
    let timer = null;
    if (username) {
      timer = setTimeout(() => search(username, dispatch, token), 1000);
    }
    return () => {
      cancel("No longer the latest query") || clearTimeout(timer)
    }
  }, [username])

  const handleSearchSelect = async (data) => {
    if (data.login.toLowerCase() === result[0].login.toLowerCase()) {
      dispatch({type: "add"})
      const res = await axios.get(`https://api.github.com/users/${data.login}`)
      const user = res.data;
      setUsers(prevUsers => {
        return prevUsers.filter(prevUser => prevUser.id === user.id).length ? prevUsers : prevUsers.concat(user)
      })
      setUsername("")
      dispatch({type: "end"})
    } else {
      dispatch({type: 'success', data: [data]})
      setUsername("")
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      dispatch({type: "add"})
      const res = await axios.get(`https://api.github.com/users/${inputRef.current.value}`)
      const user = res.data;
      setUsers(prevUsers => {
        return prevUsers.filter(prevUser => prevUser.id === user.id).length ? prevUsers : prevUsers.concat(user)
      })
      setUsername("")
      dispatch({type: "end"})
    } catch (error) {
      dispatch({type: "error"})
      console.log(error)
    }
  }

  return (
    <div className="w-full h-auto bg-gray-100 border border-gray-200 p-4 pb-8 flex flex-col justify-center shadow-inner">
      <div className="self-center sm:w-2/3 lg:w-1/2 z-10 min-w-full sm:min-w-0">
        <div className="h-6">
          {message && <span className={`text-xs ${isError ? `text-red-400` : `text-green-400`}`}>{message}</span>}
        </div>
        <form onSubmit={handleSubmit} className="flex w-full overflow-hidden">
          <div className="flex-1">
            <input onChange={handleSearch} autoComplete="off" spellCheck="false" name="userName" value={username} ref={inputRef} style={{caretColor: `${isError ? `red` : `green`}`}} className={`p-4 w-full text-base font-semibold text-gray-700 h-12 border bg-gray-200 hover:bg-gray-300 outline-none focus:outline-none
            rounded-none shadow-inner`} type="text" placeholder="Search..." required/>
            {(result.length > 0) && <Search className="max-h-52 w-full min-w-max  overflow-y-scroll bg-white border border-gray-100 rounded-b-lg" onAction={handleSearchSelect} users={result} />}
          </div>
        </form>
      </div>
    </div>
  )
}

function UsersList({setUsers, users}) {

  const [intro, setIntro] = useState({});

  const getRandomIntro = () => {
    const options = [
      {id: 1, message:"🤞 Search for some friends.."},
      {id: 2,message: "🌙 Search for Search.."},
      {id: 3, message: "🤲 Search for somebody.."},
      {id: 4, message: "😴 Keep me busy.."},
      {id: 5, message: "😎 Search for yourself.."},
      {id: 6, message: "👑 Search for Google.."},
      {id: 7, message: "🔥 Search for Facebook.."},
      {id: 8, message: "💥 Search for Instagram.."},
      {id: 9, message: "😴 I'm bored already.."},
    ]

    const notSoRandomSelection = Math.floor(Math.random() * options.length);

    return options[notSoRandomSelection]
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setIntro(getRandomIntro())
    }, 7000);
    return () => {
      clearInterval(timer)
    }
  }, [intro])

  function handleDelete(id) {
    setUsers(prevUsers => (
      prevUsers.filter(user => user.id !== id)
    ))
  }

  return (
    <div style={{visibility: (intro.id || users.length) ? `visible` : `hidden`}}>
      <span className="mt-4 p-4 h-auto flex flex-wrap-reverse gap-12 justify-start bg-gray-100">
        {users.length ? users.map(user =>
              <User key={user.id} {...user} onAction={handleDelete} />
            )
            :
            <div className="w-full min-h-0 text-center text-gray-600">
              <div className="min-w-full sm:min-w-0 sm:w-64 mx-auto">
                {intro.id && <div className="w-full shadow-inner p-2 bg-gray-200 rounded-b-md typewriter">
                  <div key={intro.id} className="typewriter">
                  {intro.message}
                  </div>
                </div>}
              </div>
            </div>
          }
      </span>
    </div>
  )
}

function User({id, avatar_url, name, login, company, onAction}) {
  return (
    <div className="flex items-start gap-2 p-4 w-full md:w-96 md:flex-grow  bg-gray-200 shadow-inner">
      <div className="flex-1 flex flex-col md:flex-row gap-2">
        <img width={100} src={avatar_url} alt="github user"/>
        <div className=" flex flex-col">
          <span className="font-bold text-base text-gray-800">{name}</span>
          <span className="text-sm text-gray-700">@{login}</span>
          <span className="text-sm text-gray-700">{company}</span>
        </div>
      </div>
      <span role="button" onClick={() => onAction(id)} className="p-4 bg-gray-100 h-8 w-8 rounded-full flex justify-center items-center opacity-50 cursor-pointer hover:bg-red-200">x</span>
    </div>
  )
}

export default App;

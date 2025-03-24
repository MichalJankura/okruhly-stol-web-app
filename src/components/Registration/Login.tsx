const Login = () => {
    return (
      <div className="flex w-full max-w-full mx-12 overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-[3750px]">
        <div 
          className="hidden bg-cover lg:block lg:w-1/4" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606660265514-358ebbadc80d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1575&q=80')" }}
        ></div>
        
        <div className="w-full px-80 py-10 md:px-40 lg:w-3/4">
          <div className="flex justify-center mx-auto">
            <img className="w-auto h-9 sm:h-11" src=" " alt="Logo" />
          </div>
  
          <p className="mt-3 text-xl text-center text-gray-600 dark:text-gray-200">Welcome back!</p>
  
          <button className="flex items-center justify-center w-full mt-4 text-base text-gray-600 transition-colors duration-300 transform border rounded-lg dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
            <div className="px-4 py-2">
              <svg className="w-8 h-8" viewBox="0 0 40 40">
                <path d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z" fill="#FFC107" />
              </svg>
            </div>
            <span className="w-5/6 px-4 py-3 font-bold text-center">Sign in with Google</span>
          </button>
  
          <div className="flex items-center justify-between mt-4">
            <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4"></span>
            <span className="text-sm text-center text-gray-500 uppercase dark:text-gray-400">or login with email</span>
            <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4"></span>
          </div>
  
          <div className="mt-4">
            <label className="block mb-2 text-base font-medium text-gray-600 dark:text-gray-200">Email Address</label>
            <input className="block w-full px-5 py-2.5 text-base text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300" type="email" />
          </div>
  
          <div className="mt-4">
            <label className="block mb-2 text-base font-medium text-gray-600 dark:text-gray-200">Password</label>
            <input className="block w-full px-5 py-2.5 text-base text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300" type="password" />
          </div>
  
          <div className="mt-6">
            <button className="w-full px-8 py-3 text-base font-medium tracking-wide text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300">Sign In</button>
          </div>
  
          <div className="flex items-center justify-between mt-4">
            <span className="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
            <span className="text-sm text-gray-500 uppercase dark:text-gray-400">or sign up</span>
            <span className="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
          </div>
        </div>
      </div>
    );
  };
  
  export default Login;
import { useState } from "react";
import { eventEmitter } from '../../utils/events';

interface LoginProps {
  onRegisterClick: () => void;
  onClose: () => void;
}

export default function Login({ onRegisterClick, onClose }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log('Full API Response:', data);
      console.log('User data from API:', data.user);

      if (!response.ok) {
        throw new Error(data.error || 'Prihlásenie zlyhalo');
      }

      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      
      if (data.user) {
        console.log('Storing user data:', data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Close the login component
      onClose();

      // Emit auth change event
      eventEmitter.emit('authChange');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Prihlásenie zlyhalo');
    }
  };

  return (
    <section className="max-w-md mx-auto flex box-border justify-center items-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
        <h2 className="font-bold text-3xl text-[#002D74] mb-2">Prihlásenie</h2>
        <p className="text-sm text-gray-600 mb-6">Ak ste už členom, môžete sa jednoducho prihlásiť.</p>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            className="p-3 rounded-lg border border-gray-300 focus:border-[#002D74] focus:outline-none transition-colors" 
            type="email" 
            name="email" 
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required 
          />
          <div className="relative">
            <input 
              className="p-3 rounded-lg border border-gray-300 w-full focus:border-[#002D74] focus:outline-none transition-colors" 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Heslo"
              value={formData.password}
              onChange={handleChange}
              required 
            />
            {!showPassword ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                fill="gray" 
                className="bi bi-eye absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer z-20 opacity-100"
                viewBox="0 0 16 16"
                onClick={togglePasswordVisibility}
              >
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                fill="currentColor"
                className="bi bi-eye-slash-fill absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer z-20"
                viewBox="0 0 16 16"
                onClick={togglePasswordVisibility}
              >
                <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/>
                <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/>
              </svg>
            )}
          </div>
          <button 
            className="bg-[#002D74] text-white py-3 rounded-lg hover:bg-[#206ab1] transition-colors font-medium" 
            type="submit"
          >
            Prihlásiť sa
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={onRegisterClick}
            className="text-[#002D74] hover:text-[#206ab1] transition-colors font-medium"
          >
            Nemáte účet? Zaregistrujte sa
          </button>
        </div>
      </div>
    </section>
  );
}

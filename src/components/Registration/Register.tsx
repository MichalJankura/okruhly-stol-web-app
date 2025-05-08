import { useState } from "react";

interface RegisterProps {
  onLoginClick: () => void;
}

export default function Register({ onLoginClick }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
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

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Heslá sa nezhodujú");
      return;
    }

    try {
      const response = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrácia zlyhala');
      }

      // Registration successful
      onLoginClick();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrácia zlyhala');
    }
  };

  return (
    <section className="max-w-md mx-auto flex box-border justify-center items-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
        <h2 className="font-bold text-3xl text-[#002D74] mb-2">Registrácia</h2>
        <p className="text-sm text-gray-600 mb-6">Vytvorte si účet a začnite používať našu službu</p>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            className="p-3 rounded-lg border border-gray-300 focus:border-[#002D74] focus:outline-none transition-colors" 
            type="text" 
            name="firstName" 
            placeholder="Meno"
            value={formData.firstName}
            onChange={handleChange}
            required 
          />
          <input 
            className="p-3 rounded-lg border border-gray-300 focus:border-[#002D74] focus:outline-none transition-colors" 
            type="text" 
            name="lastName" 
            placeholder="Priezvisko"
            value={formData.lastName}
            onChange={handleChange}
            required 
          />
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
            <div 
              onClick={togglePasswordVisibility}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            >
              {!showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" className="bi bi-eye" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" className="bi bi-eye-slash" viewBox="0 0 16 16">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708"/>
                </svg>
              )}
            </div>
          </div>
          <input 
            className="p-3 rounded-lg border border-gray-300 focus:border-[#002D74] focus:outline-none transition-colors" 
            type="password" 
            name="confirmPassword" 
            placeholder="Potvrďte heslo"
            value={formData.confirmPassword}
            onChange={handleChange}
            required 
          />
          <button 
            className="bg-[#002D74] text-white py-3 rounded-lg hover:bg-[#206ab1] transition-colors font-medium" 
            type="submit"
          >
            Registrovať sa
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={onLoginClick}
            className="text-[#002D74] hover:text-[#206ab1] transition-colors font-medium"
          >
            Už máte účet? Prihláste sa
          </button>
        </div>
      </div>
    </section>
  );
} 

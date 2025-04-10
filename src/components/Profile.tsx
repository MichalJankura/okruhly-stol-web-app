import React, { useState, useReducer, useEffect } from "react";
import { FaEye, FaEyeSlash, FaCamera } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PreferencesState {
  eventCategories: string[];
  preferredTime: string;
  preferredDistance: string;
  budgetRange: string;
  eventSize: string;
  additionalNotes: string;
}

interface PreferencesAction {
  type: string;
  field?: string;
  value?: any;
}

const initialState: PreferencesState = {
  eventCategories: [],
  preferredTime: "",
  preferredDistance: "0-5",
  budgetRange: "free",
  eventSize: "",
  additionalNotes: ""
};

function preferencesReducer(state: PreferencesState, action: PreferencesAction): PreferencesState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field as string]: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface User {
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
}

const Profile = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde");
  const [preferences, dispatch] = useReducer(preferencesReducer, initialState);
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  // Use useEffect to set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only run this effect on the client side
  useEffect(() => {
    if (!isClient) return;
    
    // Check for user data in localStorage when component mounts
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Načítané údaje používateľa:', parsedUser);
      setUser(parsedUser);
      
      // Set form values from user data
      setFormData({
        fullName: `${parsedUser.firstName || ''} ${parsedUser.lastName || ''}`.trim(),
        email: parsedUser.email || '',
        password: ''
      });
    }
  }, [isClient]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Veľkosť súboru by mala byť menšia ako 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      password: ""
    };
    let isValid = true;

    if (!formData.fullName) {
      newErrors.fullName = "Meno je povinné";
      isValid = false;
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Meno musí mať aspoň 2 znaky";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "E-mail je povinný";
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Neplatná e-mailová adresa";
      isValid = false;
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Heslo musí mať aspoň 8 znakov";
      isValid = false;
    } else if (formData.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = "Heslo musí obsahovať veľké písmeno, malé písmeno, číslo a špeciálny znak";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Split full name into first and last name
    const nameParts = formData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create updated user object
    const updatedUser = {
      ...user,
      firstName,
      lastName,
      email: formData.email
    };
    
    // Only update password if provided
    if (formData.password) {
      updatedUser.password = formData.password;
    }
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update user state
    setUser(updatedUser);
    
    // Show success message
    toast.success("Profil bol úspešne aktualizovaný!");
    console.log({ formData, preferences });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg p-6">
          <h1 className="text-heading font-heading text-foreground mb-8">Nastavenia profilu</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profil"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <label className="absolute bottom-0 right-0 bg-primary hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                    <FaCamera />
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.png,.webp"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Celé meno
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-md bg-background"
                  />
                  {errors.fullName && <p className="text-destructive mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    E-mailová adresa
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-md bg-background"
                  />
                  {errors.email && <p className="text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Heslo
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-md bg-background"
                      placeholder="Ponechať prázdne pre zachovanie aktuálneho hesla"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Preferencie</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategórie podujatí (Vyberte najviac 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {["Hudba", "Šport", "Umenie", "Technológie", "Jedlo", "Divadlo"].map((category) => (
                      <label key={category} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={category}
                          checked={preferences.eventCategories.includes(category)}
                          onChange={(e) => {
                            const selected = e.target.checked
                              ? [...preferences.eventCategories, category].slice(0, 3)
                              : preferences.eventCategories.filter((c: string) => c !== category);
                            dispatch({ type: "UPDATE_FIELD", field: "eventCategories", value: selected });
                          }}
                          className="form-checkbox"
                          disabled={!preferences.eventCategories.includes(category) && preferences.eventCategories.length >= 3}
                        />
                        <span className="ml-2">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Preferovaný čas dňa</label>
                  <select
                    value={preferences.preferredTime}
                    onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "preferredTime", value: e.target.value })}
                    className="w-full p-3 border rounded-md bg-background"
                  >
                    <option value="">Vyberte čas</option>
                    <option value="morning">Ráno</option>
                    <option value="afternoon">Popoludnie</option>
                    <option value="evening">Večer</option>
                    <option value="night">Noc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vzdialenosť</label>
                  <select
                    value={preferences.preferredDistance}
                    onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "preferredDistance", value: e.target.value })}
                    className="w-full p-3 border rounded-md bg-background"
                  >
                    <option value="0-5">0-5 km</option>
                    <option value="5-15">5-15 km</option>
                    <option value="15-30">15-30 km</option>
                    <option value="30+">30+ km</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rozpočet</label>
                  <select
                    value={preferences.budgetRange}
                    onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "budgetRange", value: e.target.value })}
                    className="w-full p-3 border rounded-md bg-background"
                  >
                    <option value="free">Zdarma</option>
                    <option value="under10">&lt; €10</option>
                    <option value="10-30">€10-30</option>
                    <option value="30plus">€30+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Veľkosť podujatia</label>
                  <div className="space-x-4">
                    {["Malé", "Stredné", "Veľké"].map((size) => (
                      <label key={size} className="inline-flex items-center">
                        <input
                          type="radio"
                          value={size.toLowerCase()}
                          checked={preferences.eventSize === size.toLowerCase()}
                          onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "eventSize", value: e.target.value })}
                          className="form-radio"
                        />
                        <span className="ml-2">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dodatočné poznámky</label>
                  <textarea
                    value={preferences.additionalNotes}
                    onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "additionalNotes", value: e.target.value })}
                    placeholder="Zdieľajte ďalšie záujmy"
                    className="w-full p-3 border rounded-md bg-background"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Uložiť zmeny
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Profile;

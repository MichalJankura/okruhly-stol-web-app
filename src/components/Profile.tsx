import React, { useState, useReducer, useEffect } from "react";

interface PreferencesState {
  eventCategories: string[];
  preferredTime: string;
  preferredDistance: string;
  budgetRange: string;
  timeMatters: boolean;
  distanceMatters: boolean;
  budgetMatters: boolean;
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
  timeMatters: true,
  distanceMatters: true,
  budgetMatters: true
};

function preferencesReducer(state: PreferencesState, action: PreferencesAction): PreferencesState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field as string]: action.value };
    case "RESET":
      return initialState;
    case "LOAD":
      return { ...state, ...action.value };
    default:
      return state;
  }
}

interface User {
  id?: string | number;
  user_id?: string | number;
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');

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

      // Fetch preferences from backend
      const userId = parsedUser.user_id || parsedUser.id;
      if (userId) {
        console.log('Fetching preferences for user_id:', userId);
        fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/preferences?user_id=${userId}`)
          .then(async response => {
            console.log('Preferences response status:', response.status);
            const data = await response.json();
            console.log('Raw preferences data:', data);
            
            if (response.ok) {
              // Initialize preferences with default values
              const loadedPreferences: PreferencesState = {
                eventCategories: [],
                preferredTime: "",
                preferredDistance: "0-5",
                budgetRange: "free",
                timeMatters: true,
                distanceMatters: true,
                budgetMatters: true
              };

              // If the response is an array of event categories
              if (Array.isArray(data)) {
                console.log('Received array of categories:', data);
                loadedPreferences.eventCategories = data;
              } else {
                // Merge the received data with default values
                Object.assign(loadedPreferences, data);
                
                // Ensure eventCategories is an array
                if (data.eventCategories) {
                  loadedPreferences.eventCategories = Array.isArray(data.eventCategories) 
                    ? data.eventCategories 
                    : [data.eventCategories];
                }
              }

              console.log('Final loaded preferences:', loadedPreferences);
              dispatch({ type: 'LOAD', value: loadedPreferences });
              setNotification({ message: 'Preferencie boli načítané!', type: 'success' });
            } else {
              console.error('Error response:', data);
              setNotification({ message: data.error || 'Chyba pri načítaní preferencií.', type: 'error' });
            }
          })
          .catch((error) => {
            console.error('Error fetching preferences:', error);
            setNotification({ message: 'Chyba pri načítaní preferencií.', type: 'error' });
          });
      } else {
        console.log('No user_id or id found in user data');
      }
    } else {
      console.log('No user data found in localStorage');
    }
  }, [isClient]);

  // Add geolocation effect
  useEffect(() => {
    if (!isClient || !user) return;

    if ("geolocation" in navigator) {
      setLocationStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const userId = user?.user_id || user?.id;
          if (userId) {
            try {
              const response = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, latitude, longitude })
              });
              
              if (response.ok) {
                setLocationStatus('success');
                setNotification({ message: 'Poloha bola úspešne aktualizovaná!', type: 'success' });
              } else {
                setLocationStatus('error');
                setNotification({ message: 'Nepodarilo sa aktualizovať polohu.', type: 'error' });
              }
            } catch (error) {
              setLocationStatus('error');
              setNotification({ message: 'Chyba pri aktualizácii polohy.', type: 'error' });
            }
          }
        },
        (error: GeolocationPositionError) => {
          setLocationStatus('error');
          let errorMessage = 'Nepodarilo sa získať vašu polohu.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Prístup k poloze bol zamietnutý. Prosím, povolte prístup k poloze v nastaveniach prehliadača.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informácie o polohe nie sú dostupné.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Vypršal časový limit na získanie polohy.';
              break;
          }
          
          setNotification({ 
            message: errorMessage,
            type: 'error' 
          });
        }
      );
    } else {
      setLocationStatus('not-supported');
      setNotification({ 
        message: 'Vaš prehliadač nepodporuje geolokáciu.', 
        type: 'error' 
      });
    }
  }, [user, isClient]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicitly return undefined when notification is null
  }, [notification]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          message: "Veľkosť súboru by mala byť menšia ako 5MB",
          type: 'error'
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Save preferences to backend if user_id exists
    const userId = user?.user_id || user?.id;
    if (userId) {
      try {
        const payload = {
          user_id: userId,
          eventCategories: preferences.eventCategories,
          preferredTime: preferences.preferredTime,
          preferredDistance: preferences.preferredDistance,
          budgetRange: preferences.budgetRange,
          timeMatters: preferences.timeMatters,
          distanceMatters: preferences.distanceMatters,
          budgetMatters: preferences.budgetMatters
        };
        
        console.log('Saving preferences with payload:', payload);
        
        const response = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        console.log('Save response status:', response.status);
        const data = await response.json();
        console.log('Save response data:', data);
        
        if (response.ok) {
          setNotification({ message: 'Preferencie boli uložené do databázy!', type: 'success' });
        } else {
          setNotification({ message: data.error || 'Chyba pri ukladaní preferencií.', type: 'error' });
        }
      } catch (err) {
        console.error('Error saving preferences:', err);
        setNotification({ message: 'Chyba pri ukladaní preferencií.', type: 'error' });
      }
    } else {
      console.log('No user_id or id found when trying to save preferences');
    }
    
    // Show success message for profile
    setNotification({
      message: "Profil bol úspešne aktualizovaný!",
      type: 'success'
    });
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
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg p-6">
          <h1 className="text-heading font-heading text-foreground mb-8">Nastavenia profilu</h1>

          {locationStatus === 'requesting' && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
              Získavam vašu polohu...
            </div>
          )}

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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
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
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Preferencie</h2>
                <button
                  onClick={() => {
                    dispatch({ type: "RESET" });
                    setNotification({ 
                      message: "Preferencie boli vynulované!", 
                      type: 'success' 
                    });
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Vynulovať preferencie
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategórie podujatí (Vyberte najviac 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Koncert", "Divadlo", "Výstava",
                      "Vernisáž / Výstava", "Trh / Jarmok / Burza",
                      "Sprevádzanie", "Kultúrne podujatie", "Ostatné"
                    ].map((category) => (
                      <label key={category} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={category}
                          checked={preferences.eventCategories.includes(category)}
                          onChange={(e) => {
                            const selected = e.target.checked
                              ? [...preferences.eventCategories, category].slice(0, 3)
                              : preferences.eventCategories.filter((c) => c !== category);
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
                  <div className="space-y-2">
                    <select
                      value={preferences.preferredTime}
                      onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "preferredTime", value: e.target.value })}
                      className="w-full p-3 border rounded-md bg-background"
                      disabled={!preferences.timeMatters}
                    >
                      <option value="">Vyberte čas</option>
                      <option value="morning">Ráno</option>
                      <option value="afternoon">Popoludnie</option>
                      <option value="evening">Večer</option>
                      <option value="night">Noc</option>
                    </select>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!preferences.timeMatters}
                        onChange={(e) => {
                          const isChecked = !e.target.checked;
                          dispatch({ type: "UPDATE_FIELD", field: "timeMatters", value: isChecked });
                          if (!isChecked) {
                            dispatch({ type: "UPDATE_FIELD", field: "preferredTime", value: "" });
                          }
                        }}
                        className="form-checkbox"
                      />
                      <span className="ml-2">Nezáleží</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vzdialenosť</label>
                  <div className="space-y-2">
                    <select
                      value={preferences.preferredDistance}
                      onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "preferredDistance", value: e.target.value })}
                      className="w-full p-3 border rounded-md bg-background"
                      disabled={!preferences.distanceMatters}
                    >
                      <option value="0-5">0 – 5 km</option>
                      <option value="5-20">5 – 20 km</option>
                      <option value="20-35">20 – 35 km</option>
                      <option value="35+">35+ km</option>
                    </select>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!preferences.distanceMatters}
                        onChange={(e) => {
                          const isChecked = !e.target.checked;
                          dispatch({ type: "UPDATE_FIELD", field: "distanceMatters", value: isChecked });
                          if (!isChecked) {
                            dispatch({ type: "UPDATE_FIELD", field: "preferredDistance", value: "0-5" });
                          }
                        }}
                        className="form-checkbox"
                      />
                      <span className="ml-2">Nezáleží</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rozpočet</label>
                  <div className="space-y-2">
                    <select
                      value={preferences.budgetRange}
                      onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "budgetRange", value: e.target.value })}
                      className="w-full p-3 border rounded-md bg-background"
                      disabled={!preferences.budgetMatters}
                    >
                      <option value="free">Zdarma</option>
                      <option value="under10">&lt; €10</option>
                      <option value="10-30">€10-30</option>
                      <option value="30plus">€30+</option>
                    </select>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!preferences.budgetMatters}
                        onChange={(e) => {
                          const isChecked = !e.target.checked;
                          dispatch({ type: "UPDATE_FIELD", field: "budgetMatters", value: isChecked });
                          if (!isChecked) {
                            dispatch({ type: "UPDATE_FIELD", field: "budgetRange", value: "free" });
                          }
                        }}
                        className="form-checkbox"
                      />
                      <span className="ml-2">Nezáleží</span>
                    </label>
                  </div>
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
    </div>
  );
};

export default Profile;

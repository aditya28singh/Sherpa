import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
  
    setLoading(true);
    setMessage(null);
  
    try {
      const loginRes = await fetch("https://experience-api.masaischool.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          query: `
            mutation login($input: LoginInput!) {
              login(input: $input) { id }
            }
          `,
          variables: {
            input: {
              email: formData.email,
              password: formData.password,
              rememberMe: false
            }
          },
          operationName: "login"
        })
      });
  
      const loginResult = await loginRes.json();
  
      if (loginRes.ok && loginResult.data?.login?.id) {
        const userRes = await fetch("https://experience-api.masaischool.com/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            query: `
              query getAuthMe {
                me {
                  id
                  name
                  username
                  role
                  sections_enrolled { id name }
                }
              }
            `,
            operationName: "getAuthMe"
          })
        });
  
        const userResult = await userRes.json();
        const user = userResult.data?.me;
        
        if (user) {
          localStorage.setItem('authData', JSON.stringify({ 
            authenticated: true, 
            role: user.role 
          }));
  
          // Redirect based on role
          window.location.href = 
            user.role === 'admin' ? "/admin" : 
            user.role === 'mentor' ? "/mentor" : 
            user.role === 'student' ? "/student" : "/select-role";
        }
  
      } else {
        setMessage({
          type: "error",
          text: loginResult.errors?.[0]?.message || "Invalid credentials or login failed.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-100 to-white">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-red-100 transform transition-all hover:scale-105">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Sign in to continue</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-red-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 text-gray-700 bg-gray-50 rounded-lg focus:ring-2 focus:ring-red-400 focus:bg-white border-transparent focus:border-red-300 transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-500" />
                </div>
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 text-gray-700 bg-gray-50 rounded-lg focus:ring-2 focus:ring-red-400 focus:bg-white border-transparent focus:border-red-300 transition-all duration-200 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
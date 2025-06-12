import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ==========================
//   Helpers
// ==========================
function sanitizeFilename(filename: string) {
  return filename
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// ==========================
//   Componente Principal
// ==========================
const App: React.FC = () => {
  // --------------------------
  //   Estado Global
  // --------------------------
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState("login");
  const [users, setUsers] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [conferences, setConferences] = useState<any[]>([]);
  //const [loading, setLoading] = useState(false);

  // --------------------------
  //   Cargar datos globales
  // --------------------------
  async function fetchGlobals() {
    setLoading(true);
    const { data: usersData } = await supabase.from("users").select("*");
    setUsers(usersData || []);
    const { data: articlesData } = await supabase.from("articles").select("*");
    setArticles(articlesData || []);
    const { data: conferencesData } = await supabase.from("conferences").select("*");
    setConferences(conferencesData || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchGlobals();
  }, []);

  // =========================
//   LOGIN/REGISTRO (LoginForm + SignUpForm)
// =========================
    function isValidEmail(email: string) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    const LoginForm = () => {
      const [view, setView] = useState<"login" | "signup">("login");
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [name, setName] = useState(""); // Solo para sign up
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [successMsg, setSuccessMsg] = useState<string | null>(null);
    
      // --------- LOGIN (solo para autores) -----------
      const handleLogin = async () => {
        setError(null);
        setSuccessMsg(null);
        if (!email.trim() || !password.trim()) {
          setError("Debes ingresar correo y contraseña.");
          return;
        }
        if (!isValidEmail(email)) {
          setError("Correo electrónico no válido.");
          return;
        }
        setLoading(true);
    
        // LOGIN con Supabase Auth
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
    
        if (authError) {
          setError("No se pudo ingresar: " + authError.message);
          setLoading(false);
          return;
        }
        if (!data.user) {
          setError("Usuario no encontrado o sin confirmar.");
          setLoading(false);
          return;
        }
    
        // Trae datos extendidos desde user_metadata
        setCurrentUser({
          ...data.user,
          user_type: data.user.user_metadata?.user_type || "author",
          name: data.user.user_metadata?.name || "",
          email: data.user.email
        });
        setCurrentView(`${data.user.user_metadata?.user_type || "author"}-dashboard`);
        setLoading(false);
      };
    
      // --------- REGISTRO SOLO PARA AUTORES -----------
      const handleSignUp = async () => {
        setError(null);
        setSuccessMsg(null);
    
        if (!email.trim() || !password.trim() || !name.trim()) {
          setError("Completa todos los campos.");
          return;
        }
        if (!isValidEmail(email)) {
          setError("Correo electrónico no válido.");
          return;
        }
        setLoading(true);
    
        // REGISTRO en Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, user_type: "author" }
          }
        });
    
        if (signUpError) {
          setError("No se pudo registrar: " + signUpError.message);
          setLoading(false);
          return;
        }
    
        // Si el usuario se creó, insértalo también en la tabla users (con el mismo uuid)
        if (data.user) {
          // Chequear si ya existe (por si acaso)
          const { data: exists } = await supabase
            .from("users")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();
    
          if (!exists) {
            await supabase.from("users").insert([
              {
                id: data.user.id,           // EL MISMO UUID
                email: email,
                name: name,
                user_type: "author",
                created_at: new Date().toISOString(),
                is_active: true
              }
            ]);
          }
        }
    
        setSuccessMsg("¡Registro exitoso! Revisa tu correo y confirma tu cuenta para poder ingresar.");
        setEmail("");
        setPassword("");
        setName("");
        setLoading(false);
      };
    
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-indigo-400">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">
              Sistema de Gestión de Conferencias
            </h2>
            {view === "login" ? (
              <>
                {error && (
                  <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 text-green-700 text-sm bg-green-50 border border-green-200 rounded p-2">
                    {successMsg}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    autoFocus
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {loading ? "Ingresando..." : "Ingresar"}
                </button>
                <div className="text-sm text-gray-500 mt-4 text-center">
                  ¿No tienes cuenta?{" "}
                  <button
                    className="underline text-blue-700 font-bold"
                    onClick={() => setView("signup")}
                  >
                    Regístrate como autor
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-4 text-center">
                  Admin demo: <b>admin@continental.edu.pe / Admin#8</b>
                </div>
              </>
            ) : (
              // --- FORMULARIO DE REGISTRO DE AUTOR ---
              <>
                {error && (
                  <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 text-green-700 text-sm bg-green-50 border border-green-200 rounded p-2">
                    {successMsg}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                    autoFocus
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>
                <div className="mb-6">
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {loading ? "Registrando..." : "Registrarme"}
                </button>
                <div className="text-sm text-gray-500 mt-4 text-center">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    className="underline text-indigo-700 font-bold"
                    onClick={() => setView("login")}
                  >
                    Inicia sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      );
    };
  

  // ===================================================
  //   CAMBIO DE CONTRASEÑA
  // ===================================================
  const ChangePasswordForm = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    const handleChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setMsg(null);
      if (newPassword.length < 6) {
        setMsg("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirm) {
        setMsg("Las contraseñas no coinciden.");
        return;
      }
      const { error } = await supabase
        .from("users")
        .update({ password: newPassword, needs_password_change: false })
        .eq("id", currentUser.id);

      if (error) {
        setMsg("No se pudo cambiar la contraseña.");
        return;
      }
      setMsg("Contraseña cambiada correctamente. Redirigiendo...");
      setTimeout(() => {
        setCurrentUser({ ...currentUser, password: newPassword, needs_password_change: false });
        setCurrentView(`${currentUser.user_type}-dashboard`);
      }, 1200);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 to-blue-300">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-center">
            Cambio de Contraseña
          </h2>
          <form onSubmit={handleChange}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-700">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
            {msg && (
              <div className="mb-3 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded p-2 text-sm">
                {msg}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    );
  };

  // ===================================================
  //   PANEL ADMIN
  // ===================================================
  const AdminDashboard = () => {
    const [showUserForm, setShowUserForm] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [userType, setUserType] = useState("organizer");
    const [userName, setUserName] = useState("");
    const [adminMsg, setAdminMsg] = useState<string | null>(null);

    // Crea usuario de cualquier rol
    const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setAdminMsg(null);
      if (!userEmail || !userName) {
        setAdminMsg("Completa todos los campos.");
        return;
      }
      // No crear si ya existe
      const { data: exists } = await supabase.from("users").select("*").eq("email", userEmail).maybeSingle();
      if (exists) {
        setAdminMsg("Ese email ya está registrado.");
        return;
      }
      await supabase.from("users").insert([{
        email: userEmail, name: userName, user_type: userType, password: "123456",
        needs_password_change: true, is_active: true, created_at: new Date().toISOString(),
      }]);
      await fetchGlobals();
      setAdminMsg("¡Usuario creado! Contraseña: 123456");
      setUserEmail(""); setUserName(""); setUserType("organizer");
      setShowUserForm(false);
    };

    // Activa/desactiva usuario
    const handleToggleActive = async (user: any) => {
      await supabase.from("users").update({ is_active: !user.is_active }).eq("id", user.id);
      await fetchGlobals();
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-200 p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-indigo-700">Panel de Administrador</h1>
          <button onClick={() => setShowUserForm(true)} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded">+ Nuevo usuario</button>
          {showUserForm && (
            <form onSubmit={handleCreateUser} className="bg-indigo-50 p-4 mb-6 rounded-xl">
              <div className="mb-2"><label className="block font-bold text-sm">Nombre</label>
                <input className="border px-2 py-1 rounded w-full" value={userName} onChange={e => setUserName(e.target.value)} /></div>
              <div className="mb-2"><label className="block font-bold text-sm">Email</label>
                <input className="border px-2 py-1 rounded w-full" value={userEmail} onChange={e => setUserEmail(e.target.value)} /></div>
              <div className="mb-2"><label className="block font-bold text-sm">Rol</label>
                <select className="border px-2 py-1 rounded w-full" value={userType} onChange={e => setUserType(e.target.value)}>
                  <option value="organizer">Organizador</option>
                  <option value="reviewer">Revisor</option>
                  <option value="admin">Administrador</option>
                </select></div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Crear</button>
                <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowUserForm(false)}>Cancelar</button>
              </div>
              {adminMsg && <div className="text-xs text-indigo-700 mt-2">{adminMsg}</div>}
            </form>
          )}
          <h2 className="text-lg font-bold mb-3">Usuarios</h2>
          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="text-left bg-indigo-100">
                <th className="p-1">Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="p-1">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.user_type}</td>
                  <td>{u.is_active ? "Sí" : "No"}</td>
                  <td>
                    <button className={`text-xs ${u.is_active ? "bg-red-300" : "bg-green-300"} px-2 py-1 rounded`}
                      onClick={() => handleToggleActive(u)}>
                      {u.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => { setCurrentUser(null); setCurrentView("login"); }}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-xl shadow font-bold w-full mt-8">Salir</button>
        </div>
      </div>
    );
  };

  // ===================================================
  //   PANEL AUTOR
  // ===================================================
  // --- PANEL AUTOR (sube/ver artículos) ---
const AuthorDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [conferenceId, setConferenceId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const myArticles = articles.filter(a => a.user_id === currentUser.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title || !abstract || !file || !conferenceId) {
      setFormError("Todos los campos y el archivo son obligatorios.");
      return;
    }
    setFormLoading(true);

    const cleanName = sanitizeFilename(file.name);
    const filePath = `${currentUser.id}/${Date.now()}_${cleanName}`;
    const { error: storageError } = await supabase.storage
      .from("articulos")
      .upload(filePath, file);

    if (storageError) {
      setFormError("Error subiendo el archivo: " + storageError.message);
      setFormLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("articulos")
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from("articles")
      .insert([
        {
          title, abstract, keywords,
          user_id: currentUser.id,
          conference_id: conferenceId,
          status: "enviado",
          file_url: publicUrlData?.publicUrl || "",
          file_name: file.name,
          version: 1,
          created_at: new Date().toISOString(),
        },
      ]);
    if (dbError) {
      setFormError("Error guardando en la base de datos: " + dbError.message);
      setFormLoading(false);
      return;
    }
    setShowForm(false); setTitle(""); setAbstract(""); setKeywords(""); setConferenceId(""); setFile(null); setFormLoading(false);
    await fetchGlobals();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 p-6">
      <div className="max-w-2xl mx-auto mt-10 bg-white/90 p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700">Panel del Autor</h1>
        <button className="mb-4 bg-green-600 text-white px-4 py-2 rounded" onClick={() => setShowForm(true)}>
          + Nuevo Artículo
        </button>
        {/* Formulario */}
        {showForm && (
          <form className="bg-indigo-50 rounded-xl p-6 shadow mb-6" onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold mb-4 text-indigo-700">Nuevo Artículo</h2>
            {formError && <div className="mb-3 text-red-600">{formError}</div>}
            <div className="mb-3">
              <label className="block mb-1 text-sm font-semibold">Título</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-sm font-semibold">Resumen</label>
              <textarea value={abstract} onChange={e => setAbstract(e.target.value)} className="w-full border px-3 py-2 rounded" required rows={3} />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-sm font-semibold">Palabras clave (separadas por coma)</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-sm font-semibold">Conferencia</label>
              <select className="w-full border px-3 py-2 rounded" required value={conferenceId} onChange={e => setConferenceId(e.target.value)}>
                <option value="">Seleccione...</option>
                {conferences.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-semibold">Archivo PDF/Word</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border px-3 py-2 rounded bg-white" required />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow disabled:opacity-60" disabled={formLoading}>
                {formLoading ? "Enviando..." : "Guardar Artículo"}
              </button>
              <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold shadow" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}
        <p className="mb-4 text-gray-600">Tus artículos:</p>
        <ul className="mb-8 space-y-2">
          {myArticles.length === 0 && <li>No tienes artículos</li>}
          {myArticles.map(art => (
            <li key={art.id} className="p-4 bg-indigo-50 rounded-xl shadow">
              <div className="font-bold text-indigo-700">{art.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                Estado: <span className="font-semibold">{art.status}</span>
                {art.file_url && (
                  <a href={art.file_url} target="_blank" rel="noopener noreferrer" className="ml-4 text-blue-600 underline">
                    Ver archivo
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button onClick={() => { setCurrentUser(null); setCurrentView("login"); }} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl shadow font-bold w-full">
          Salir
        </button>
      </div>
    </div>
  );
};

  // ===================================================
  //   PANEL REVISOR
  // ===================================================
  const ReviewerDashboard = () => {
    const [assignedArticles, setAssignedArticles] = useState<any[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [reviewText, setReviewText] = useState("");
    const [recommendation, setRecommendation] = useState("accept");
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
      const fetchAssigned = async () => {
        const { data: assignments } = await supabase.from("article_reviewers").select("article_id").eq("reviewer_id", currentUser.id);
        if (!assignments || assignments.length === 0) {
          setAssignedArticles([]);
          return;
        }
        const articleIds = assignments.map((a: any) => a.article_id);
        const { data: arts } = await supabase.from("articles").select("*").in("id", articleIds);
        setAssignedArticles(arts || []);
      };
      fetchAssigned();
    }, [currentUser]);

    const handleReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedArticle) return;
      if (!reviewText) {
        setMsg("El comentario es obligatorio.");
        return;
      }
      setMsg(null);
    
      // 1. Inserta la review
      await supabase.from("reviews").insert([{
        article_id: selectedArticle.id,
        reviewer_id: currentUser.id,
        recommendation,
        comments: reviewText,
        submitted_at: new Date().toISOString(),
      }]);
    
      // 2. Actualiza el status del artículo según la recomendación
      let newStatus = "";
      switch (recommendation) {
        case "accept":
          newStatus = "aceptado";
          break;
        case "minor_revisions":
          newStatus = "revisiones menores";
          break;
        case "major_revisions":
          newStatus = "revisiones mayores";
          break;
        case "reject":
          newStatus = "rechazado";
          break;
        default:
          newStatus = "en revisión";
      }
      await supabase.from("articles").update({ status: newStatus }).eq("id", selectedArticle.id);
    
      setMsg("¡Revisión registrada y estado actualizado!");
      setSelectedArticle(null);
      setReviewText("");
      setRecommendation("accept");
      // Recarga artículos si necesitas
      await fetchGlobals();
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-blue-200 p-6">
        <div className="max-w-3xl mx-auto mt-10 bg-white/90 p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-indigo-700">Panel del Revisor</h1>
          <p className="mb-4 text-gray-600">Artículos asignados:</p>
          <ul className="space-y-2">
            {assignedArticles.length === 0 && <li>No tienes artículos asignados</li>}
            {assignedArticles.map((art) => (
              <li key={art.id} className="p-4 bg-blue-50 rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-bold text-blue-700">{art.title}</div>
                  <div className="text-sm text-gray-600 mt-1">Estado: <span className="font-semibold">{art.status}</span></div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                  {art.file_url && (
                    <a href={art.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">Descargar archivo</a>
                  )}
                  <button className="bg-indigo-500 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
                    onClick={() => setSelectedArticle(art)}>Revisar</button>
                </div>
              </li>
            ))}
          </ul>
          {/* Formulario revisión */}
          {selectedArticle && (
            <form className="bg-indigo-50 border p-6 mt-6 rounded-xl" onSubmit={handleReview}>
              <h2 className="text-xl font-bold mb-2">Revisando: {selectedArticle.title}</h2>
              <label className="block font-bold text-sm mt-2 mb-1">Recomendación</label>
              <select value={recommendation} onChange={e => setRecommendation(e.target.value)} className="border px-2 py-1 rounded w-full mb-2">
                <option value="accept">Aceptar</option>
                <option value="minor_revisions">Revisiones Menores</option>
                <option value="major_revisions">Revisiones Mayores</option>
                <option value="reject">Rechazar</option>
              </select>
              <label className="block font-bold text-sm mb-1">Comentarios</label>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4}
                className="w-full border px-2 py-2 rounded mb-2"></textarea>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enviar</button>
                <button type="button" className="bg-gray-200 px-4 py-2 rounded"
                  onClick={() => setSelectedArticle(null)}>Cancelar</button>
              </div>
              {msg && <div className="mt-2 text-green-600">{msg}</div>}
            </form>
          )}
          <button onClick={() => { setCurrentUser(null); setCurrentView("login"); }} className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-xl shadow font-bold w-full mt-8">Salir</button>
        </div>
      </div>
    );
  };

  // ===================================================
  //   PANEL ORGANIZADOR
  // ===================================================
  const OrganizerDashboard = () => {
    const [showConfForm, setShowConfForm] = useState(false);
    const [confName, setConfName] = useState("");
    const [confDesc, setConfDesc] = useState("");
    const [confDeadline, setConfDeadline] = useState("");
    const [confDate, setConfDate] = useState("");
    const [confLoc, setConfLoc] = useState("");
    const [confMsg, setConfMsg] = useState<string | null>(null);
    const [assignArtId, setAssignArtId] = useState("");
    const [assignRevId, setAssignRevId] = useState("");
    const [assignMsg, setAssignMsg] = useState<string | null>(null);

    // Crea conferencia
    const handleConf = async (e: React.FormEvent) => {
      e.preventDefault();
      setConfMsg(null);
      if (!confName || !confDesc || !confDeadline || !confDate || !confLoc) {
        setConfMsg("Todos los campos son obligatorios.");
        return;
      }
      await supabase.from("conferences").insert([{
        name: confName, description: confDesc, deadline: confDeadline,
        conference_date: confDate, location: confLoc, status: "active", created_at: new Date().toISOString()
      }]);
      setConfMsg("Conferencia creada.");
      setShowConfForm(false);
      setConfName(""); setConfDesc(""); setConfDeadline(""); setConfDate(""); setConfLoc("");
      await fetchGlobals();
    };

    // Asigna revisor
    const handleAssign = async (e: React.FormEvent) => {
      e.preventDefault();
      setAssignMsg(null);
      if (!assignArtId || !assignRevId) {
        setAssignMsg("Selecciona artículo y revisor.");
        return;
      }
      // Evitar duplicados
      const { data: exists } = await supabase.from("article_reviewers")
        .select("*")
        .eq("article_id", assignArtId)
        .eq("reviewer_id", assignRevId);
    
      if (exists && exists.length > 0) {
        setAssignMsg("Ya asignado.");
        return;
      }
      // Intenta el insert y muestra el error si ocurre
      const { error } = await supabase.from("article_reviewers")
        .insert([{ article_id: assignArtId, reviewer_id: assignRevId }]);
    
      if (error) {
        setAssignMsg("Error en la asignación: " + error.message);
        return;
      }
      setAssignMsg("¡Revisor asignado!");
      setAssignArtId(""); setAssignRevId("");
    };

    const reviewers = users.filter(u => u.user_type === "reviewer");
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-blue-200 p-6">
        <div className="max-w-4xl mx-auto mt-10 bg-white/90 p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-indigo-700">Panel del Organizador</h1>
          <button className="mb-4 bg-green-600 text-white px-4 py-2 rounded" onClick={() => setShowConfForm(true)}>
            + Nueva conferencia
          </button>
          {showConfForm && (
            <form className="bg-indigo-50 border p-4 rounded-xl mb-6" onSubmit={handleConf}>
              <div className="mb-2"><label className="block font-bold text-sm">Nombre</label>
                <input className="border px-2 py-1 rounded w-full" value={confName} onChange={e => setConfName(e.target.value)} /></div>
              <div className="mb-2"><label className="block font-bold text-sm">Descripción</label>
                <textarea className="border px-2 py-1 rounded w-full" value={confDesc} onChange={e => setConfDesc(e.target.value)} /></div>
              <div className="mb-2"><label className="block font-bold text-sm">Fecha Límite</label>
                <input type="date" className="border px-2 py-1 rounded w-full" value={confDeadline} onChange={e => setConfDeadline(e.target.value)} /></div>
              <div className="mb-2"><label className="block font-bold text-sm">Fecha Conferencia</label>
                <input type="date" className="border px-2 py-1 rounded w-full" value={confDate} onChange={e => setConfDate(e.target.value)} /></div>
              <div className="mb-2"><label className="block font-bold text-sm">Lugar</label>
                <input className="border px-2 py-1 rounded w-full" value={confLoc} onChange={e => setConfLoc(e.target.value)} /></div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Crear</button>
                <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowConfForm(false)}>Cancelar</button>
              </div>
              {confMsg && <div className="text-xs text-indigo-700 mt-2">{confMsg}</div>}
            </form>
          )}

          <h2 className="text-lg font-bold mt-8 mb-2">Asignar Revisor a Artículo</h2>
          <form className="bg-indigo-50 border p-4 rounded-xl mb-6" onSubmit={handleAssign}>
            <div className="mb-2"><label className="block font-bold text-sm">Artículo</label>
              <select className="border px-2 py-1 rounded w-full" value={assignArtId} onChange={e => setAssignArtId(e.target.value)}>
                <option value="">Seleccione artículo...</option>
                {articles.map(a => (<option key={a.id} value={a.id}>{a.title}</option>))}
              </select></div>
            <div className="mb-2"><label className="block font-bold text-sm">Revisor</label>
              <select className="border px-2 py-1 rounded w-full" value={assignRevId} onChange={e => setAssignRevId(e.target.value)}>
                <option value="">Seleccione revisor...</option>
                {reviewers.map(r => (<option key={r.id} value={r.id}>{r.name} ({r.email})</option>))}
              </select></div>
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Asignar</button>
            </div>
            {assignMsg && <div className="text-xs text-indigo-700 mt-2">{assignMsg}</div>}
          </form>

          <button onClick={() => { setCurrentUser(null); setCurrentView("login"); }}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-xl shadow font-bold w-full mt-8">Salir</button>
        </div>
      </div>
    );
  };

  // ===================================================
  //   RENDER PRINCIPAL
  // ===================================================
  if (!currentUser) return <LoginForm />;
  if (currentView === "change-password") return <ChangePasswordForm />;
  if (currentView === "admin-dashboard") return <AdminDashboard />;
  if (currentView === "author-dashboard") return <AuthorDashboard />;
  if (currentView === "organizer-dashboard") return <OrganizerDashboard />;
  if (currentView === "reviewer-dashboard") return <ReviewerDashboard />;
  return <LoginForm />;
};

export default App;


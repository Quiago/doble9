import { useState } from "react";
import { GoldBtn, Panel, ChromaImg } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useAuth } from "@/hooks";
import { useUiStore } from "@/store/uiStore";
import { dlog } from "@/lib/debug";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const toast = useUiStore((s) => s.toast);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      if (isLogin) {
        await login({ identifier: email, password });
        toast("Has iniciado sesión", "success");
      } else {
        await register({ username, email, password });
        toast("Cuenta creada con éxito", "success");
      }
      onSuccess();
    } catch (err: any) {
      dlog("error", "auth failed", err);
      let errMsg = err.message || "Error de autenticación";
      
      // FastAPI validation error fallback
      if (err.body?.detail && Array.isArray(err.body.detail)) {
        const errs = err.body.detail;
        if (errs.length > 0) {
          const field = errs[0].loc?.[errs[0].loc.length - 1];
          const msg = errs[0].msg;
          errMsg = `${field}: ${msg}`;
        }
      } else if (err.body?.code === "unprocessable_entity" && err.body?.details?.errors) {
        const errs = err.body.details.errors as any[];
        if (errs.length > 0) {
          const field = errs[0].loc?.[errs[0].loc.length - 1];
          const msg = errs[0].msg;
          errMsg = `${field}: ${msg}`;
        }
      }
      if (err.status === 401) {
        errMsg = "Credenciales inválidas";
      }
      setErrorMsg(errMsg);
      toast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="c-modal-overlay s-auth">
      <Panel gold className="s-auth__panel">
        <ChromaImg 
          className="s-auth__img" 
          src={ASSETS.manolitoHold} 
          alt="Manolito" 
        />
        
        <h2 className="s-auth__title">
          {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
        </h2>
        
        {errorMsg && (
          <div className="s-auth__error" style={{ background: "rgba(255,0,0,0.2)", border: "1px solid #ff4444", padding: "10px", borderRadius: "8px", color: "#ff4444", marginBottom: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
            {errorMsg}
          </div>
        )}

        <p className="s-auth__sub">
          {isLogin 
            ? "Continúa guardando tus estadísticas y progresos."
            : "Crea tu perfil para guardar tus partidas y estadísticas."}
        </p>

        <form onSubmit={handleSubmit} className="s-auth__form">
          {!isLogin && (
            <div className="s-auth__field">
              <label>Usuario</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="s-auth__input"
                placeholder="Ej. Manolito9"
              />
            </div>
          )}
          
          <div className="s-auth__field">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="s-auth__input"
              placeholder="tu@correo.com"
            />
          </div>
          
          <div className="s-auth__field">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="s-auth__input"
              placeholder="••••••••"
            />
          </div>

          <GoldBtn size="lg" fullWidth disabled={loading} type="submit" style={{ marginTop: 16 }}>
            {loading ? "Procesando..." : isLogin ? "ENTRAR" : "CREAR CUENTA"}
          </GoldBtn>
        </form>

        <div className="s-auth__toggle">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="s-textlink">
            {isLogin ? "Regístrate" : "Inicia Sesión"}
          </button>
        </div>

        <button className="c-modal-close" onClick={onClose}>×</button>
      </Panel>
    </div>
  );
}

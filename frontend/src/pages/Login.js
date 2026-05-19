import { useState } from "react";
import styled from "styled-components";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

/* --- STYLES --- */
const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #111827, #1f2937);
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: rgba(15, 23, 42, 0.92);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.08);
box-shadow: 0 8px 40px rgba(0,0,0,0.35);
color: white;
  border-radius: 16px;

  padding: 40px 30px;

  @media (max-width: 768px) {
    padding: 24px;
    margin: 16px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin-bottom: 15px;
  background: #111827;
border: 1px solid #374151;
color: white;
border-radius: 10px;
font-size: 16px;
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #facc15;
color: black;
border: none;
border-radius: 10px;
font-weight: bold;
font-size: 16px;
`;

const Error = styled.p`
  color: red;
  text-align: center;
`;

/* --- COMPONENT --- */
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  // 1️⃣ profile al
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    setError("Kullanıcı bulunamadı");
    return;
  }

  // 2️⃣ login
  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

  if (loginError) {
    setError("Şifre yanlış");
    return;
  }

  // 🔥 🔥 🔥 KRİTİK SATIR
  localStorage.setItem("roles", JSON.stringify(profile.roles));
  

  // 🔥 role seçimi
  if (profile.roles.includes("admin")) {
    localStorage.setItem("activeRole", "admin");
    navigate("/admin/dashboard");
  } else {
    localStorage.setItem("activeRole", "driver");
    navigate("/driver");
  }
};



  return (
    <Page>
      <Card>
        <h2>🚕 Taxi App</h2>

        <Input
          placeholder="Kullanıcı Adı"
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Şifre"
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button onClick={handleLogin}>Giriş Yap</Button>

        {error && <Error>{error}</Error>}
      </Card>
    </Page>
  );
}

export default Login;

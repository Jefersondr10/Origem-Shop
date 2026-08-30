import Link from "next/link";
import {LockKeyhole} from "lucide-react";
import {loginAction} from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({searchParams}: {searchParams: Promise<{erro?: string}>}) {
  const params = await searchParams;
  return <main className="login-page">
    <section className="login-card">
      <Link href="/" className="brand-mark compact"><span>O</span><strong>Origem</strong></Link>
      <div className="login-icon"><LockKeyhole /></div>
      <h1>Painel gerencial</h1>
      <p>Entre para gerenciar preços, promoções, contatos, marcas e parcelamento.</p>
      {params.erro && <div className="form-error">Senha incorreta.</div>}
      <form action={loginAction} className="form-stack">
        <label>Senha administrativa<input name="password" type="password" autoComplete="current-password" required autoFocus /></label>
        <button className="primary-button" type="submit">Entrar</button>
      </form>
      <Link href="/" className="text-link">Voltar ao catálogo</Link>
    </section>
  </main>;
}

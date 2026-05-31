import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Sparkles, Key, Mail, User as UserIcon, Smile, Users, LogIn, UserPlus, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (userId: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧔');
  const [groupChoice, setGroupChoice] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emojisList = ['🧔', '👩', '👨', '🧑', '👧', '👦', '👵', '👴', '🦊', '🐱', '🦄', '🦁', '🦉', '🐼', '🤖', '👾'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        // Sign up logic
        if (!name.trim()) throw new Error('Por favor, informe seu nome.');

        let resolvedGroupId = '';
        let codeToUse = '';

        if (groupChoice === 'join') {
          if (!inviteCode.trim()) throw new Error('Por favor, informe o código de convite do grupo.');
          
          // Check if group exists
          const { data: groupData, error: groupErr } = await supabase
            .from('groups')
            .select('id')
            .eq('invite_code', inviteCode.trim().toUpperCase())
            .single();

          if (groupErr || !groupData) {
            throw new Error('Código de convite inválido ou grupo não encontrado.');
          }
          resolvedGroupId = groupData.id;
        } else {
          // Generate a custom short invite code: FLOW-XXXX
          const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
          codeToUse = `FLOW-${rand}`;

          const { data: newGroup, error: createGroupErr } = await supabase
            .from('groups')
            .insert({ invite_code: codeToUse })
            .select()
            .single();

          if (createGroupErr || !newGroup) {
            throw new Error('Erro ao criar grupo financeiro. Tente novamente.');
          }
          resolvedGroupId = newGroup.id;
        }

        // 1. Sign up auth user
        const { data: authData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpErr || !authData.user) {
          throw new Error(signUpErr?.message || 'Erro ao registrar usuário.');
        }

        // 2. Create the profile
        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            group_id: resolvedGroupId,
            name: name.trim(),
            emoji: emoji,
          });

        if (profileErr) {
          throw new Error('Erro ao criar perfil. Por favor, tente atualizar no app.');
        }

        // 3. Create default group settings if creating a group
        if (groupChoice === 'create') {
          await supabase
            .from('group_settings')
            .insert({
              group_id: resolvedGroupId,
              monthly_budget: 2500,
            });
          
          // Create default accounts
          await supabase
            .from('accounts')
            .insert([
              { group_id: resolvedGroupId, name: 'Nubank', emoji: '🟣', color: '#8b5cf6', initial_balance: 1500.00 },
              { group_id: resolvedGroupId, name: 'Carteira', emoji: '💵', color: '#10b981', initial_balance: 100.00 },
              { group_id: resolvedGroupId, name: 'Itaú', emoji: '🟧', color: '#f59e0b', initial_balance: 2000.00 }
            ]);
        }

        alert(`Conta criada com sucesso! ${codeToUse ? `Seu código de convite é: ${codeToUse}` : ''}`);
        onLoginSuccess(authData.user.id);
      } else {
        // Sign in logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          throw new Error(error?.message || 'E-mail ou senha inválidos.');
        }

        onLoginSuccess(data.user.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '24px 8px',
      gap: '24px'
    }}>
      {/* Header Logo */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div className="app-logo" style={{ fontSize: '2.2rem', justifyContent: 'center' }}>
          <Sparkles size={32} fill="currentColor" />
          <span>PoupaFlow</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px' }}>
          Finanças compartilhadas e inteligentes com sincronização em tempo real.
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-panel" style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background glows */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--color-brand-glow)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: !isSignUp ? 'var(--color-brand)' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <LogIn size={16} />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: isSignUp ? 'var(--color-brand)' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <UserPlus size={16} />
            <span>Cadastrar</span>
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'var(--color-outflow-glow)',
            border: '1px solid var(--color-outflow)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            padding: '12px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            lineHeight: 1.4
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
          {/* Email input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--surface-border)',
                  background: 'rgba(0, 0, 0, 0.15)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--surface-border)',
                  background: 'rgba(0, 0, 0, 0.15)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Sign Up extra fields */}
          {isSignUp && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome de Exibição</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome ou apelido"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      background: 'rgba(0, 0, 0, 0.15)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Emoji avatar selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smile size={14} /> Escolha seu Emoji de Avatar
                </label>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '4px 0',
                  scrollbarWidth: 'none'
                }}>
                  {emojisList.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      style={{
                        fontSize: '1.4rem',
                        background: emoji === e ? 'var(--color-brand-glow)' : 'transparent',
                        border: emoji === e ? '1px solid var(--color-brand)' : '1px solid transparent',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        flexShrink: 0
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Choice */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} /> Grupo Financeiro
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setGroupChoice('create')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '0.8rem',
                      background: groupChoice === 'create' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: groupChoice === 'create' ? '1px solid var(--color-brand)' : '1px solid var(--surface-border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    Criar Novo Grupo
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupChoice('join')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '0.8rem',
                      background: groupChoice === 'join' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: groupChoice === 'join' ? '1px solid var(--color-brand)' : '1px solid var(--surface-border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    Participar Existente
                  </button>
                </div>

                {groupChoice === 'join' && (
                  <div style={{ marginTop: '6px' }}>
                    <input
                      type="text"
                      required
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      placeholder="Código de Convite (ex: FLOW-ABCD)"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--surface-border)',
                        background: 'rgba(0, 0, 0, 0.15)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-purple) 100%)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              boxShadow: '0 4px 12px var(--color-brand-glow)',
              transition: 'var(--transition-smooth)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <span>Processando...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Entrar no PoupaFlow'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

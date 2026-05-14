import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  FileCheck, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import * as cryptoUtils from './lib/crypto.ts';

type Tab = 'overview' | 'keys' | 'encrypt' | 'sign';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [encKeys, setEncKeys] = useState<cryptoUtils.KeyPair | null>(null);
  const [signKeys, setSignKeys] = useState<cryptoUtils.KeyPair | null>(null);
  const [exportEncPublic, setExportEncPublic] = useState('');
  const [exportEncPrivate, setExportEncPrivate] = useState('');
  const [exportSignPublic, setExportSignPublic] = useState('');
  const [exportSignPrivate, setExportSignPrivate] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Encryption state
  const [plainText, setPlainText] = useState('');
  const [cipherText, setCipherText] = useState('');
  const [decryptionInput, setDecryptionInput] = useState('');
  const [decryptedText, setDecryptedText] = useState('');

  // Signature state
  const [signText, setSignText] = useState('');
  const [signature, setSignature] = useState('');
  const [verifyText, setVerifyText] = useState('');
  const [verifySig, setVerifySig] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    try {
      const ek = await cryptoUtils.generateRSAKeyPair(2048);
      const sk = await cryptoUtils.generateSigningKeyPair(2048);
      
      setEncKeys(ek);
      setSignKeys(sk);

      setExportEncPublic(await cryptoUtils.exportKey(ek.publicKey));
      setExportEncPrivate(await cryptoUtils.exportKey(ek.privateKey));
      setExportSignPublic(await cryptoUtils.exportKey(sk.publicKey));
      setExportSignPrivate(await cryptoUtils.exportKey(sk.privateKey));
    } catch (err) {
      console.error("Key generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEncrypt = async () => {
    if (!encKeys?.publicKey || !plainText) return;
    const encrypted = await cryptoUtils.encryptMessage(encKeys.publicKey, plainText);
    setCipherText(cryptoUtils.bufferToBase64(encrypted));
  };

  const handleDecrypt = async () => {
    if (!encKeys?.privateKey || !decryptionInput) return;
    try {
      const buffer = cryptoUtils.base64ToBuffer(decryptionInput);
      const decrypted = await cryptoUtils.decryptMessage(encKeys.privateKey, buffer);
      setDecryptedText(decrypted);
    } catch (err) {
      setDecryptedText("Decryption failed. Ensure you are using the correct private key.");
    }
  };

  const handleSign = async () => {
    if (!signKeys?.privateKey || !signText) return;
    const sig = await cryptoUtils.signMessage(signKeys.privateKey, signText);
    setSignature(cryptoUtils.bufferToBase64(sig));
  };

  const handleVerify = async () => {
    if (!signKeys?.publicKey || !verifySig || !verifyText) return;
    try {
      const buffer = cryptoUtils.base64ToBuffer(verifySig);
      const isValid = await cryptoUtils.verifySignature(signKeys.publicKey, buffer, verifyText);
      setVerifyResult(isValid);
    } catch (err) {
      setVerifyResult(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
        activeTab === id 
          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Cipher RSA Studio</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Secure Cryptography Sandbox</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Activity size={14} className="text-emerald-500" />
              <span>Web Crypto API: Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>RSA-2048: Standard</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto no-scrollbar">
          <TabButton id="overview" label="Systems Overview" icon={Info} />
          <TabButton id="keys" label="Key Management" icon={Key} />
          <TabButton id="encrypt" label="Encryption" icon={Lock} />
          <TabButton id="sign" label="Signatures" icon={FileCheck} />
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="crypto-card col-span-2">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-emerald-400">
                      <Zap size={24} />
                      RSA Cryptography Fundamentals
                    </h2>
                    <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
                      <p>
                        RSA is an asymmetric encryption algorithm that operates on the principle of a <strong>Public Key</strong> 
                        and a <strong>Private Key</strong>. Unlike symmetric encryption (where the same key is used for both), 
                        RSA allows anyone to encrypt data using your public key, but only you can decrypt it using your private key.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                          <h3 className="text-emerald-400 font-bold mb-2 text-sm uppercase tracking-wider">Public Key</h3>
                          <p className="text-xs leading-relaxed">
                            Think of this as an open mailbox. Anyone can drop a letter in, but they can't take anything out. 
                            It is safe to share with the world.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                          <h3 className="text-rose-400 font-bold mb-2 text-sm uppercase tracking-wider">Private Key</h3>
                          <p className="text-xs leading-relaxed">
                            This is the key to the mailbox. Only you have it. If you lose it, the encrypted letters 
                            stay locked forever. <strong>Never share this key.</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="crypto-card bg-emerald-500/5 border-emerald-500/20">
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-emerald-400">
                        <Lock size={20} />
                        Encryption (OAEP)
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">
                        We use <strong>RSA-OAEP</strong> (Optimal Asymmetric Encryption Padding) with SHA-256 for maximum security 
                        against chosen-ciphertext attacks.
                      </p>
                    </div>
                    <div className="crypto-card bg-blue-500/5 border-blue-500/20">
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-400">
                        <FileCheck size={20} />
                        Signatures (PKCS1)
                      </h3>
                      <p className="text-xs text-slate-400">
                        For identities, we use <strong>RSASSA-PKCS1-v1_5</strong>. This allows you to "sign" data, proving it was 
                        sent by you and hasn't been altered.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="crypto-card border-slate-800/50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-emerald-500" />
                      Security Recommendations
                    </h3>
                    <ul className="text-sm space-y-3 text-slate-400">
                      <li className="flex items-start gap-2 italic">
                        <span className="text-emerald-500 mt-1">•</span> 
                        Use at least 2048-bit keys for modern standards.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span> 
                        Store Private Keys in hardware security modules (HSM) or encrypted vaults.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span> 
                        Always use secure entropy sources for random data generation.
                      </li>
                    </ul>
                  </div>
                  <div className="crypto-card border-slate-800/50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" />
                      Digital Signature Process
                    </h3>
                    <ol className="text-sm space-y-3 text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 font-mono">1.</span> 
                        Data is hashed into a small, unique footprint.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 font-mono">2.</span> 
                        The hash is encrypted using your <strong>Private Key</strong>.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 font-mono">3.</span> 
                        Recipient uses your <strong>Public Key</strong> to verify the hash matches.
                      </li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}

            {/* KEYS TAB */}
            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Key Generator</h2>
                    <p className="text-slate-400 text-sm">Generate separate RSA key pairs for Encryption and Signing.</p>
                  </div>
                  <button 
                    disabled={isGenerating}
                    onClick={handleGenerateKeys}
                    className="btn-primary w-full sm:w-auto"
                  >
                    <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                    {encKeys ? 'Regenerate All Keys' : 'Generate Keys'}
                  </button>
                </div>

                {encKeys ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Encryption Keys */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-500/10 rounded-lg w-fit">
                        <Lock size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Encryption Pair (RSA-OAEP)</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Public Key (SPKI)</label>
                            <button 
                              onClick={() => copyToClipboard(exportEncPublic, 'enc-pub')}
                              className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                            >
                              {copied === 'enc-pub' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copied === 'enc-pub' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <textarea 
                            readOnly 
                            value={exportEncPublic}
                            className="input-field h-32 resize-none text-[10px] opacity-70"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Private Key (PKCS8)</label>
                            <button 
                               onClick={() => copyToClipboard(exportEncPrivate, 'enc-priv')}
                              className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                            >
                              {copied === 'enc-priv' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copied === 'enc-priv' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <textarea 
                            readOnly 
                            value={exportEncPrivate}
                            className="input-field h-32 resize-none text-[10px] opacity-70 border-rose-900/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Signing Keys */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2 p-2 bg-blue-500/10 rounded-lg w-fit">
                        <FileCheck size={16} className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Signing Pair (RSA-PKCS1)</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Public Key (SPKI)</label>
                            <button 
                              onClick={() => copyToClipboard(exportSignPublic, 'sign-pub')}
                              className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                            >
                               {copied === 'sign-pub' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copied === 'sign-pub' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <textarea 
                            readOnly 
                            value={exportSignPublic}
                            className="input-field h-32 resize-none text-[10px] opacity-70"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Private Key (PKCS8)</label>
                            <button 
                              onClick={() => copyToClipboard(exportSignPrivate, 'sign-priv')}
                              className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                            >
                              {copied === 'sign-priv' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copied === 'sign-priv' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <textarea 
                            readOnly 
                            value={exportSignPrivate}
                            className="input-field h-32 resize-none text-[10px] opacity-70 border-rose-900/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="crypto-card flex flex-col items-center justify-center py-20 bg-slate-900/20 border-dashed">
                    <Key size={48} className="text-slate-700 mb-4" />
                    <p className="text-slate-500 mb-6">No keys generated yet.</p>
                    <button 
                      onClick={handleGenerateKeys}
                      disabled={isGenerating}
                      className="btn-secondary"
                    >
                      {isGenerating ? 'Computing...' : 'Generate New Key Studio'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ENCRYPTION TAB */}
            {activeTab === 'encrypt' && (
              <motion.div
                key="encrypt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {!encKeys && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm flex items-center gap-3">
                    <Info size={18} />
                    You need to generate keys in the "Key Management" tab first.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Encryption Section */}
                  <div className="crypto-card h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Lock size={20} className="text-emerald-500" />
                      Encrypt Message
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Uses the Public Key to seal data.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-2 block tracking-wider uppercase">Plaintext Message</label>
                        <textarea 
                          placeholder="Type your sensitive message here..."
                          value={plainText}
                          onChange={(e) => setPlainText(e.target.value)}
                          className="input-field h-24"
                        />
                      </div>
                      <button 
                        onClick={handleEncrypt}
                        disabled={!encKeys || !plainText}
                        className="btn-primary w-full"
                      >
                        Encrypt Message
                      </button>
                      
                      {cipherText && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Result (Base64 Ciphertext)</label>
                            <button 
                              onClick={() => copyToClipboard(cipherText, 'cipher')}
                              className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                            >
                               {copied === 'cipher' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                               {copied === 'cipher' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="p-3 bg-slate-950 border border-emerald-950 rounded-lg font-mono text-[10px] break-all text-slate-300">
                            {cipherText}
                          </div>
                          <button 
                            onClick={() => {
                              setDecryptionInput(cipherText);
                              setDecryptedText('');
                            }}
                            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Zap size={12} />
                            Send to Decryptor
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decryption Section */}
                  <div className="crypto-card h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Unlock size={20} className="text-blue-500" />
                      Decrypt Message
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Uses the Private Key to reveal data.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-2 block tracking-wider uppercase">Ciphertext (Base64)</label>
                        <textarea 
                          placeholder="Paste ciphertext to decrypt..."
                          value={decryptionInput}
                          onChange={(e) => setDecryptionInput(e.target.value)}
                          className="input-field h-24"
                        />
                      </div>
                      <button 
                        onClick={handleDecrypt}
                        disabled={!encKeys || !decryptionInput}
                        className="btn-secondary w-full"
                      >
                        Decrypt with Private Key
                      </button>

                      {decryptedText && (
                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                          <label className="text-[10px] font-bold text-blue-400 tracking-widest uppercase mb-1 block">Recovered Plaintext</label>
                          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-50 font-medium">
                            {decryptedText}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SIGNATURES TAB */}
            {activeTab === 'sign' && (
              <motion.div
                key="sign"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {!signKeys && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm flex items-center gap-3">
                    <Info size={18} />
                    You need to generate keys in the "Key Management" tab first.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Signing Section */}
                  <div className="crypto-card h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FileCheck size={20} className="text-emerald-500" />
                      Generate Digital Signature
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Uses Private Key to sign the hash of the message.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-2 block tracking-wider uppercase">Document/Message Content</label>
                        <textarea 
                          placeholder="What would you like to sign?"
                          value={signText}
                          onChange={(e) => setSignText(e.target.value)}
                          className="input-field h-24"
                        />
                      </div>
                      <button 
                        onClick={handleSign}
                        disabled={!signKeys || !signText}
                        className="btn-primary w-full"
                      >
                        Sign Document
                      </button>

                      {signature && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Digital Signature</label>
                            <button 
                              onClick={() => copyToClipboard(signature, 'sig')}
                              className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px]"
                            >
                               {copied === 'sig' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                               {copied === 'sig' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="p-3 bg-slate-950 border border-emerald-950 rounded-lg font-mono text-[10px] break-all text-slate-400">
                            {signature}
                          </div>
                          <button 
                            onClick={() => {
                              setVerifyText(signText);
                              setVerifySig(signature);
                              setVerifyResult(null);
                            }}
                            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Zap size={12} />
                            Send to Verification
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Section */}
                  <div className="crypto-card h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-blue-500" />
                      Verify Signature
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Uses Public Key to check if data is authentic.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-2 block tracking-wider uppercase">Document to Verify</label>
                        <textarea 
                          placeholder="Paste the message content here..."
                          value={verifyText}
                          onChange={(e) => setVerifyText(e.target.value)}
                          className="input-field h-16"
                        />
                      </div>
                      <div>
                         <label className="text-xs font-medium text-slate-400 mb-2 block tracking-wider uppercase">Provided Signature</label>
                        <textarea 
                          placeholder="Paste digital signature here..."
                          value={verifySig}
                          onChange={(e) => setVerifySig(e.target.value)}
                          className="input-field h-16"
                        />
                      </div>
                      <button 
                        onClick={handleVerify}
                        disabled={!signKeys || !verifySig || !verifyText}
                        className="btn-secondary w-full"
                      >
                        Verify Identity
                      </button>

                      {verifyResult !== null && (
                        <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 animate-in bounce-in duration-300 ${
                          verifyResult 
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        }`}>
                          {verifyResult ? <CheckCircle2 size={24} /> : <Shield size={24} />}
                          <div>
                            <p className="font-bold">{verifyResult ? 'Signature Verified' : 'Verification Failed'}</p>
                            <p className="text-xs opacity-80">
                              {verifyResult 
                                ? 'The data is authentic and was signed by the holder of the matching private key.' 
                                : 'The signature does not match the content. Either the key is wrong or the data was tampered with.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-slate-500 text-sm">
            <p>© 2026 RSA Cipher Studio • Built with Web Crypto API</p>
            <p className="text-xs mt-1">Cryptography Playground for Educational Purposes</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 tracking-wider">
            <span className="flex items-center gap-1"><Lock size={12} className="text-emerald-500" /> NO SERVERS</span>
            <span className="flex items-center gap-1"><Lock size={12} className="text-emerald-500" /> LOCAL ONLY</span>
            <span className="flex items-center gap-1"><Lock size={12} className="text-emerald-500" /> NO TRACKING</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

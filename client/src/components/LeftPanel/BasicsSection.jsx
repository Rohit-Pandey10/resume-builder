import React from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react';

export default function BasicsSection({ basics = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...basics,
      [field]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      <div className="md:col-span-2">
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          Full Name
        </label>
        <div className="relative">
          <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={basics.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Jake Developer"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="email"
            value={basics.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jake@example.com"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          Phone
        </label>
        <div className="relative">
          <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={basics.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          Location
        </label>
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={basics.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="San Francisco, CA"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          LinkedIn URL
        </label>
        <div className="relative">
          <Linkedin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="url"
            value={basics.linkedinUrl || ''}
            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          GitHub URL
        </label>
        <div className="relative">
          <Github className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="url"
            value={basics.githubUrl || ''}
            onChange={(e) => handleChange('githubUrl', e.target.value)}
            placeholder="https://github.com/username"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
          Portfolio URL
        </label>
        <div className="relative">
          <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="url"
            value={basics.portfolioUrl || ''}
            onChange={(e) => handleChange('portfolioUrl', e.target.value)}
            placeholder="https://jake.dev"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>
    </div>
  );
}

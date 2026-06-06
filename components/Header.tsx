'use client';

import Link from 'next/link';

export default function Header({ showAdd = true }: { showAdd?: boolean }) {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          <span className="mark">✶</span>
          <span>
            Pantry &amp; Plate
            <br />
            <small>Ed &amp; Chantal&apos;s recipe book</small>
          </span>
        </Link>
        {showAdd && (
          <Link href="/add" className="btn btn-accent">
            + New Recipe
          </Link>
        )}
      </div>
    </header>
  );
}

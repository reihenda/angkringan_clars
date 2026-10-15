import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Kredit Foto",
  description: "Sumber dan lisensi foto yang dipakai di website Clars.",
};

const CREDITS = [
  {
    file: "/img/nasi-goreng.jpg",
    title: "Nasi Goreng Pete Kambing",
    author: "Gunawan Kartapranata",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    source: "https://commons.wikimedia.org/w/index.php?curid=19361122",
    note: "Diperkecil.",
  },
  {
    file: "/img/mie-goreng-telur.jpg",
    title: "Indomie Mie Goreng Iga Penyet 1",
    author: "Gunawan Kartapranata",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    source: "https://commons.wikimedia.org/wiki/File:Indomie_Mie_Goreng_Iga_Penyet_1.JPG",
    note: "Dipotong dan diperkecil.",
  },
  {
    file: "/img/nasi-kucing.jpg",
    title: "Nasi kucing langgi",
    author: "Crisco 1492",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    source: "https://commons.wikimedia.org/wiki/File:Nasi_kucing_langgi.jpg",
    note: "Diperkecil.",
  },
  {
    file: "/img/sate.jpg",
    title: "DSCF1097 Golden grilled chicken satay skewers laid out on banana leaves",
    author: "PattayaPatrol",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "https://commons.wikimedia.org/w/index.php?curid=194512257",
    note: "Diperkecil.",
  },
  {
    file: "/img/billiard-bola.jpg",
    title: "Break! (15955696631)",
    author: "cogdogblog",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "https://commons.wikimedia.org/wiki/File:Break!_(15955696631).jpg",
    note: "Diperkecil.",
  },
  {
    file: "/img/kopi-es.jpg",
    title: "Blue Bottle, Kyoto Style Ice Coffee (5909775445)",
    author: "Kenny Louie from Vancouver, Canada",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
    source: "https://commons.wikimedia.org/w/index.php?curid=24335826",
    note: "Diperkecil.",
  },
];

export default function KreditFotoPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-24">
      <h1 className="script text-6xl/[1] text-pink-bright sm:text-8xl/[1]">Kredit foto</h1>
      <p className="mt-6 max-w-2xl text-xl/9">
        Beberapa foto makanan dan minuman di website ini adalah foto ilustrasi dari Wikimedia Commons, bukan foto
        sajian Clars. Semuanya berlisensi terbuka yang mengizinkan pemakaian komersial dengan menyebut pembuatnya.
      </p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {CREDITS.map((c) => (
          <li key={c.file} className="overflow-hidden rounded-3xl bg-white">
            <Image
              src={c.file}
              alt={c.title}
              width={600}
              height={400}
              sizes="(min-width:640px) 400px, 90vw"
              className="h-48 w-full object-cover"
            />
            <div className="p-6">
              <h2 className="text-lg font-extrabold leading-snug">{c.title}</h2>
              <p className="mt-2 text-[16px]/7">
                Oleh {c.author}.{" "}
                <a className="font-semibold text-pink-deep underline" href={c.licenceUrl} target="_blank" rel="noopener noreferrer">
                  {c.licence}
                </a>
                . {c.note}
              </p>
              <a className="mt-2 inline-block font-semibold text-pink-deep underline" href={c.source} target="_blank" rel="noopener noreferrer">
                Lihat sumber asli
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-lg/8 text-muted">
        Foto minuman berlogo Clars berasal dari materi menu Clars sendiri.
      </p>
    </main>
  );
}

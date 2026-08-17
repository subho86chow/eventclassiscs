import Image from "next/image";
import "./Brands.css";

const BRANDS = [
  { src: "/brands/brand1.png", name: "Iqvia", width: 2172, height: 724 },
  {
    src: "/brands/brand2.png",
    name: "Manipal Hospitals",
    width: 2167,
    height: 725,
  },
  {
    src: "/brands/brand3.png",
    name: "Redmonk Wellness",
    width: 1536,
    height: 1024,
  },
  {
    src: "/brands/brand4.png",
    name: "Team Taurus",
    width: 2109,
    height: 745,
  },
] as const;

export function Brands() {
  return (
    <section className="brands" id="work">
      <div className="brands__layout">
        <header className="brands__header">
          <span className="brands__dot" aria-hidden="true" />
          <span className="brands__label">Brands we&apos;ve helped</span>
        </header>

        <div className="brands__grid">
          {BRANDS.map((brand) => (
            <div className="brands__cell" key={brand.src}>
              <Image
                className="brands__image"
                src={brand.src}
                alt={brand.name}
                width={brand.width}
                height={brand.height}
                sizes="(max-width: 767px) 45vw, 35vw"
              />
              <span className="brands__name">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Brands;

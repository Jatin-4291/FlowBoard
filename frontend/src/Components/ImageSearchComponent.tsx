import { Search } from "lucide-react";
import { useState } from "react";
import { useImagesState } from "../Context/create";

interface PixabayImage {
  id: number;
  previewURL: string;
  largeImageURL: string;
}

export default function ImageSearchComponent() {
  const [query, setQuery] = useState<string>("");
  const [images, setImagesLocal] = useState<PixabayImage[]>([]);
  const { setImage } = useImagesState();

  const handleImageMove = (image: PixabayImage) => {
    console.log("Image moved:", image);
    setImage(image.largeImageURL);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=50195782-d8dd3a074ab16b0e31ead1a02&q=${encodeURIComponent(
          query
        )}&image_type=photo&per_page=10`
      );
      const data = await res.json();
      setImagesLocal(data.hits);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-gray-800 text-black rounded-xl mt-2 p-1"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search images..."
          className="px-3 py-1 rounded-2xl border w-full"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {images.map((img) => (
          <img
            key={img.id}
            onClick={() => handleImageMove(img)}
            src={img.previewURL}
            alt="search result"
            className="w-full h-24 object-cover rounded cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
}

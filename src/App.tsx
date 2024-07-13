import React, { useEffect, useState, useRef } from 'react';

interface Image {
  _id: string;
  href: string;
  dimensions: {
    w: number;
    h: number;
  };
}

const IMAGE_MARGIN = 10 // in px

const ScrollableGrid: React.FC<{ images: Image[] }> = ({ images }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [rows, setRows] = useState<Image[][]>([]);
  const containerWidth = windowSize.width * 0.9;
  const containerHeight = windowSize.height * 0.75;

  const rowHeight = containerHeight / 4 // Divide by the number of rows you want visible
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rows: Image[][] = [];
    let currentRow: Image[] = [];
    let currentRowLength: number = 0;

    images.forEach((image) => {
      const aspectRatio = image.dimensions.w / image.dimensions.h;

      // Adjust image dimensions to maintain row height and scale width accordingly
      const newImageWidth = (rowHeight * aspectRatio);
      const newImageHeight = rowHeight;

      // If adding this image to the row exceeds the container width, scale all images in the row and begin a new row
      if (currentRowLength + newImageWidth > containerWidth && currentRow.length > 0) {
        // Calculate the dimensions for the row to fill the entire container width
        const newHeight = ((containerWidth - (IMAGE_MARGIN * (currentRow.length - 1))) * rowHeight) / currentRowLength;

        currentRow.forEach((rowImage) => {
          const newWidth = (rowImage.dimensions.w * newHeight) / rowImage.dimensions.h;
          rowImage.dimensions.h = newHeight;
          rowImage.dimensions.w = newWidth;
          currentRowLength += newWidth;
        });

        rows.push([...currentRow]);
        currentRow = [];
        currentRowLength = 0;
      }

      currentRow.push({ ...image, dimensions: { w: newImageWidth, h: newImageHeight } });
      currentRowLength += newImageWidth;
    });

    // Push the last currentRow if it's not empty
    if (currentRow.length > 0) {
      rows.push([...currentRow]);
    }

    setRows(rows);
  }, [images, containerWidth, containerHeight, rowHeight]);

  // Enable responsive layout on window resizing
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      setTimeoutId(window.setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 300));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);


  return (
    <div className="container" ref={containerRef} style={{ width: `${containerWidth}px` }}>
      {
        rows.map((row, rowIndex) => (
          <div key={rowIndex} className="row" style={{ marginBottom: `${IMAGE_MARGIN}px` }}>
            {row.map((image, index) => (
              <div key={image._id} className="image" style={{ width: `${image.dimensions.w}px`, height: `${image.dimensions.h}px`, marginRight: index < row.length - 1 ? `${IMAGE_MARGIN}px` : '0' }}>
                <img
                  src={image.href}
                  alt={image._id}
                  loading='lazy'
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.opacity = '1'; // Fade in when loaded
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.75s' }}
                />
              </div>
            ))}
          </div>
        ))
      }
    </div >
  );
};

const App: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    fetch('sample_images.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data: Image[]) => setImages(data))
      .catch(error => console.error('Error fetching image data:', error));
  }, []);

  return (
    <div className="App">
      <h1>Scrollable Justified Grid</h1>
      <ScrollableGrid images={images} />
    </div>
  );
};

export default App;
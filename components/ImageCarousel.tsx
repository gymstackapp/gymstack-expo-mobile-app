import { Colors } from "@/theme";
import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

function ImageCarousel({
  images,
  height,
}: {
  images: string[];
  height: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const extData = images.length > 1 ? [...images, images[0]] : images;

  useEffect(() => {
    if (images.length <= 1 || containerWidth === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= images.length) {
          scrollRef.current?.scrollTo({
            x: images.length * containerWidth,
            animated: true,
          });
          setTimeout(
            () => scrollRef.current?.scrollTo({ x: 0, animated: false }),
            350,
          );
          return 0;
        }
        scrollRef.current?.scrollTo({
          x: next * containerWidth,
          animated: true,
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length, containerWidth]);

  if (images.length === 0) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Icon name="dumbbell" size={28} color={Colors.textMuted} />
      </View>
    );
  }

  return (
    <View
      style={{ height }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        >
          {extData.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={{ width: containerWidth, height }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {images.length > 1 && (
        <View style={carouselStyles.dots}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                carouselStyles.dot,
                i === activeIndex && carouselStyles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  dots: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: { width: 16, backgroundColor: "#fff" },
});

export default ImageCarousel;

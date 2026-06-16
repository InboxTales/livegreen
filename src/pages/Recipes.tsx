import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Clock, ChefHat, Star, Users } from "lucide-react";
import { getPublicSettings } from "@/lib/api";

export default function Recipes() {
  const [siteSettings, setSiteSettings] = useState<any>({});

  useEffect(() => {
    getPublicSettings().then(setSiteSettings);
  }, []);

  const recipes = useMemo(() => {
    try {
      if (siteSettings.recipes_json) return JSON.parse(siteSettings.recipes_json);
    } catch (e) { console.error("Invalid recipes_json", e); }
    return [
      {
        title: "Honey Lemon Immunity Booster",
        description: "Start your morning with this powerful immunity drink made with raw honey, fresh lemon, and warm water.",
        time: "5 min",
        servings: "1",
        difficulty: "Easy",
        image: "/images/multiflora-honey.png",
        ingredients: ["1 tbsp raw honey", "½ lemon juice", "1 cup warm water", "¼ tsp turmeric (optional)"],
        steps: ["Heat water to warm (not boiling)", "Add lemon juice and honey", "Stir until honey dissolves", "Add turmeric if desired and enjoy!"],
      },
      {
        title: "Honey Oat Energy Balls",
        description: "No-bake energy balls perfect for a healthy, grab-and-go snack. Made with raw honey, oats, and nuts.",
        time: "15 min",
        servings: "12",
        difficulty: "Easy",
        image: "/images/multiflora-honey.png",
        ingredients: ["1 cup oats", "½ cup raw honey", "½ cup peanut butter", "¼ cup dark chocolate chips", "2 tbsp chia seeds"],
        steps: ["Mix all ingredients in a bowl", "Refrigerate for 30 minutes", "Roll into 12 balls", "Store in fridge for up to a week"],
      },
      {
        title: "Honey Glazed Masala Chai",
        description: "A warming spiced tea sweetened with raw honey for a natural and healthier alternative to sugar.",
        time: "10 min",
        servings: "2",
        difficulty: "Easy",
        image: "/images/multiflora-honey.png",
        ingredients: ["2 cups milk", "1 cup water", "2 tsp tea leaves", "2 tbsp raw honey", "Cardamom, ginger, cinnamon"],
        steps: ["Boil water with spices for 3 minutes", "Add tea leaves and simmer 2 minutes", "Add milk, bring to boil", "Strain, add honey once slightly cooled"],
      },
      {
        title: "Honey Almond Face Mask",
        description: "A natural skincare recipe using raw honey's antibacterial properties for glowing skin.",
        time: "20 min",
        servings: "1 use",
        difficulty: "Easy",
        image: "/images/multiflora-honey.png",
        ingredients: ["2 tbsp raw honey", "1 tbsp almond oil", "½ tsp turmeric powder"],
        steps: ["Mix all ingredients into a paste", "Apply to clean, dry face", "Leave on for 15-20 minutes", "Rinse with lukewarm water, pat dry"],
      },
    ];
  }, [siteSettings.recipes_json]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* Header */}
      <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">From Our Kitchen</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl font-bold text-white sm:text-6xl tracking-tight">Honey Recipes</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">
            Simple, delicious recipes starring the star ingredient — raw honey.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recipes.map((recipe: any, idx: number) => (
            <motion.div key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-3xl overflow-hidden border border-[#CDDBCE]/30 card-lift cursor-pointer"
            >
              <div className="aspect-[16/9] overflow-hidden relative">
                <img loading="lazy" decoding="async" src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#1B5E20] px-3 py-1 rounded-full uppercase tracking-wider font-inter flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {recipe.time}
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] font-bold text-[#3A8E3C] uppercase tracking-[0.2em] font-inter flex items-center gap-1"><ChefHat className="h-3 w-3" /> {recipe.difficulty}</span>
                  <span className="text-[10px] font-bold text-[#6B9E6E] uppercase tracking-[0.2em] font-inter flex items-center gap-1"><Users className="h-3 w-3" /> {recipe.servings} servings</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1B5E20] mb-2">{recipe.title}</h3>
                <p className="text-sm text-[#6B9E6E] leading-relaxed mb-6 font-inter">{recipe.description}</p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#1B5E20] uppercase tracking-[0.2em] mb-2 font-inter">Ingredients</h4>
                    <ul className="space-y-1.5">
                      {recipe.ingredients.map((ing: string, i: number) => (
                        <li key={i} className="text-xs text-[#4A7C4D] flex items-start gap-2 font-inter">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] mt-1.5 flex-shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-[#1B5E20] uppercase tracking-[0.2em] mb-2 font-inter">Steps</h4>
                    <ol className="space-y-1.5">
                      {recipe.steps.map((step: string, i: number) => (
                        <li key={i} className="text-xs text-[#4A7C4D] flex items-start gap-2 font-inter">
                          <span className="text-[10px] font-bold text-[#3A8E3C] mt-0.5 flex-shrink-0">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

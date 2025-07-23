import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

// Plant genetics system
interface PlantGenetics {
  yield: string; // AA, Aa, aa
  speed: string; // BB, Bb, bb  
  potency: string; // CC, Cc, cc
}

interface Plant {
  id: string;
  name: string;
  stage: 'seed' | 'sprout' | 'vegetative' | 'flowering' | 'harvest';
  progress: number;
  genetics: PlantGenetics;
  traits: {
    yield: number; // 1-10
    speed: number; // 1-10
    potency: number; // 1-10
  };
  plantedAt: number;
}

// Buds - harvested weed with unknown traits until researched
interface BudItem {
  id: string;
  name: string;
  quantity: number;
  genetics: PlantGenetics; // Hidden from player
  traits: {
    yield: number;
    speed: number;
    potency: number;
  }; // Hidden from player
  isResearched: boolean; // Whether traits are known
  harvestedAt: number;
}

// Seeds with known or unknown genetics
interface SeedItem {
  id: string;
  name: string;
  quantity: number;
  genetics: PlantGenetics;
  traits: {
    yield: number;
    speed: number;
    potency: number;
  };
  isKnownGenetics: boolean; // Whether genetics are visible to player
  createdAt: number;
}

// Store strains with fixed characteristics
interface StoreStrain {
  name: string;
  price: number;
  genetics: PlantGenetics;
  traits: {
    yield: number;
    speed: number;
    potency: number;
  };
  description: string;
}

interface GameStats {
  money: number;
  totalHarvested: number;
  bestYield: number;
  bestPotency: number;
  experimentsCount: number;
  crossbreedingAttempts: number;
}

const WeedGroove = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [buds, setBuds] = useState<BudItem[]>([]);
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    money: 1000,
    totalHarvested: 0,
    bestYield: 0,
    bestPotency: 0,
    experimentsCount: 0,
    crossbreedingAttempts: 0
  });
  const [selectedTab, setSelectedTab] = useState('farm');
  const [inventoryTab, setInventoryTab] = useState('buds');
  const [gameTime, setGameTime] = useState(Date.now());
  const [selectedSeed1, setSelectedSeed1] = useState<SeedItem | null>(null);
  const [selectedSeed2, setSelectedSeed2] = useState<SeedItem | null>(null);

  // Store strains with fixed genetics
  const storeStrains: StoreStrain[] = [
    {
      name: 'OG Kush',
      price: 100,
      genetics: { yield: 'Aa', speed: 'BB', potency: 'AA' },
      traits: { yield: 6, speed: 9, potency: 9 },
      description: 'Классический сорт с высокой крепостью'
    },
    {
      name: 'Lemon Haze',
      price: 120,
      genetics: { yield: 'AA', speed: 'Aa', potency: 'Bb' },
      traits: { yield: 8, speed: 6, potency: 5 },
      description: 'Высокая урожайность, цитрусовый аромат'
    },
    {
      name: 'Northern Lights',
      price: 80,
      genetics: { yield: 'Bb', speed: 'AA', potency: 'Aa' },
      traits: { yield: 4, speed: 10, potency: 7 },
      description: 'Быстрорастущий, устойчивый сорт'
    },
    {
      name: 'White Widow',
      price: 150,
      genetics: { yield: 'AA', speed: 'Bb', potency: 'AA' },
      traits: { yield: 9, speed: 5, potency: 8 },
      description: 'Премиум сорт с отличным балансом'
    },
    {
      name: 'Blue Dream',
      price: 90,
      genetics: { yield: 'Aa', speed: 'Aa', potency: 'Bb' },
      traits: { yield: 7, speed: 6, potency: 4 },
      description: 'Сбалансированный гибрид для новичков'
    },
    {
      name: 'Gorilla Glue',
      price: 200,
      genetics: { yield: 'AA', speed: 'aa', potency: 'AA' },
      traits: { yield: 10, speed: 3, potency: 10 },
      description: 'Максимальная урожайность и крепость'
    }
  ];

  // Load game state from localStorage
  useEffect(() => {
    const savedGame = localStorage.getItem('weedgroove-save');
    if (savedGame) {
      const data = JSON.parse(savedGame);
      setPlants(data.plants || []);
      setBuds(data.buds || []);
      setSeeds(data.seeds || []);
      setGameStats(data.gameStats || gameStats);
      setGameTime(data.gameTime || Date.now());
    }
  }, []);

  // Save game state
  useEffect(() => {
    const gameData = {
      plants,
      buds,
      seeds,
      gameStats,
      gameTime
    };
    localStorage.setItem('weedgroove-save', JSON.stringify(gameData));
  }, [plants, buds, seeds, gameStats, gameTime]);

  // Game time progression
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(prev => prev + 60000); // 1 minute per second
      
      setPlants(prev => prev.map(plant => {
        const timePassed = (gameTime - plant.plantedAt) / 1000 / 60; // minutes
        let newProgress = Math.min(100, (timePassed / (120 - plant.traits.speed * 10)) * 100);
        
        let newStage = plant.stage;
        if (newProgress >= 80) newStage = 'harvest';
        else if (newProgress >= 60) newStage = 'flowering';
        else if (newProgress >= 30) newStage = 'vegetative';
        else if (newProgress >= 10) newStage = 'sprout';
        
        return { ...plant, progress: newProgress, stage: newStage };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameTime]);

  // Generate hybrid name from parent names
  const generateHybridName = (parent1: string, parent2: string): string => {
    const words1 = parent1.toLowerCase().split(' ');
    const words2 = parent2.toLowerCase().split(' ');
    
    // Take first word from parent1 and last word from parent2
    const firstPart = words1[0];
    const secondPart = words2[words2.length - 1];
    
    // Capitalize first letters
    const hybridName = `${firstPart.charAt(0).toUpperCase() + firstPart.slice(1)} ${secondPart.charAt(0).toUpperCase() + secondPart.slice(1)}`;
    
    return hybridName;
  };

  // Calculate traits from genetics
  const calculateTraits = (genetics: PlantGenetics) => ({
    yield: genetics.yield === 'AA' ? 8 + Math.floor(Math.random() * 3) :
           genetics.yield === 'Aa' ? 5 + Math.floor(Math.random() * 3) :
           2 + Math.floor(Math.random() * 3),
    speed: genetics.speed === 'BB' ? 8 + Math.floor(Math.random() * 3) :
           genetics.speed === 'Bb' ? 5 + Math.floor(Math.random() * 3) :
           2 + Math.floor(Math.random() * 3),
    potency: genetics.potency === 'CC' ? 8 + Math.floor(Math.random() * 3) :
             genetics.potency === 'Cc' ? 5 + Math.floor(Math.random() * 3) :
             2 + Math.floor(Math.random() * 3)
  });

  // Get trait range from genetics
  const getTraitRange = (gene: string) => {
    switch (gene) {
      case 'AA': case 'BB': case 'CC': return [8, 10];
      case 'Aa': case 'Bb': case 'Cc': return [5, 7];
      case 'aa': case 'bb': case 'cc': return [2, 4];
      default: return [1, 10];
    }
  };

  // Crossbreed two seeds to create a new unknown strain
  const crossbreedSeeds = () => {
    if (!selectedSeed1 || !selectedSeed2 || selectedSeed1.quantity < 1 || selectedSeed2.quantity < 1) return;

    // Create hybrid genetics
    const hybridGenetics: PlantGenetics = {
      yield: Math.random() < 0.5 ? selectedSeed1.genetics.yield : selectedSeed2.genetics.yield,
      speed: Math.random() < 0.5 ? selectedSeed1.genetics.speed : selectedSeed2.genetics.speed,
      potency: Math.random() < 0.5 ? selectedSeed1.genetics.potency : selectedSeed2.genetics.potency
    };

    // Add some random mutation chance (10%)
    if (Math.random() < 0.1) {
      const mutations = ['AA', 'Aa', 'aa'];
      hybridGenetics.yield = mutations[Math.floor(Math.random() * 3)];
    }
    if (Math.random() < 0.1) {
      const mutations = ['BB', 'Bb', 'bb'];
      hybridGenetics.speed = mutations[Math.floor(Math.random() * 3)];
    }
    if (Math.random() < 0.1) {
      const mutations = ['CC', 'Cc', 'cc'];
      hybridGenetics.potency = mutations[Math.floor(Math.random() * 3)];
    }

    const hybridTraits = calculateTraits(hybridGenetics);
    const hybridName = generateHybridName(selectedSeed1.name, selectedSeed2.name);
    
    const newSeed: SeedItem = {
      id: Date.now().toString(),
      name: hybridName,
      quantity: 1,
      genetics: hybridGenetics,
      traits: hybridTraits,
      isKnownGenetics: false, // Player doesn't know the genetics!
      createdAt: gameTime
    };

    // Consume parent seeds
    setSeeds(prev => prev.map(seed => {
      if (seed.id === selectedSeed1.id || seed.id === selectedSeed2.id) {
        return { ...seed, quantity: seed.quantity - 1 };
      }
      return seed;
    }).filter(seed => seed.quantity > 0));

    // Add new hybrid seed
    setSeeds(prev => [...prev, newSeed]);
    
    setGameStats(prev => ({
      ...prev,
      crossbreedingAttempts: prev.crossbreedingAttempts + 1,
      experimentsCount: prev.experimentsCount + 1
    }));

    setSelectedSeed1(null);
    setSelectedSeed2(null);
  };

  const buySeed = (strain: StoreStrain) => {
    if (gameStats.money < strain.price) return;

    const newSeed: SeedItem = {
      id: Date.now().toString(),
      name: strain.name,
      quantity: 1,
      genetics: strain.genetics,
      traits: strain.traits,
      isKnownGenetics: true, // Store seeds have known genetics
      createdAt: gameTime
    };

    setSeeds(prev => {
      const existing = prev.find(s => s.name === strain.name && s.isKnownGenetics);
      if (existing) {
        return prev.map(s => 
          s.id === existing.id ? { ...s, quantity: s.quantity + 1 } : s
        );
      }
      return [...prev, newSeed];
    });

    setGameStats(prev => ({ ...prev, money: prev.money - strain.price }));
  };

  const plantSeed = (seedId: string) => {
    const seed = seeds.find(s => s.id === seedId);
    if (!seed || seed.quantity < 1) return;

    const newPlant: Plant = {
      id: Date.now().toString(),
      name: seed.name,
      stage: 'seed',
      progress: 0,
      genetics: seed.genetics,
      traits: seed.traits,
      plantedAt: gameTime
    };

    setPlants(prev => [...prev, newPlant]);
    setSeeds(prev => prev.map(s => 
      s.id === seedId ? { ...s, quantity: s.quantity - 1 } : s
    ).filter(s => s.quantity > 0));
  };

  const harvestPlant = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant || plant.stage !== 'harvest') return;
    
    // Add to buds inventory (traits hidden unless researched!)
    const budItem: BudItem = {
      id: Date.now().toString(),
      name: plant.name,
      quantity: plant.traits.yield,
      genetics: plant.genetics,
      traits: plant.traits,
      isResearched: false,
      harvestedAt: gameTime
    };

    setBuds(prev => {
      const existing = prev.find(item => item.name === plant.name && !item.isResearched);
      if (existing) {
        return prev.map(item => 
          item.id === existing.id 
            ? { ...item, quantity: item.quantity + plant.traits.yield }
            : item
        );
      }
      return [...prev, budItem];
    });
    
    setGameStats(prev => ({
      ...prev,
      totalHarvested: prev.totalHarvested + 1,
      bestYield: Math.max(prev.bestYield, plant.traits.yield),
      bestPotency: Math.max(prev.bestPotency, plant.traits.potency)
    }));
    
    setPlants(prev => prev.filter(p => p.id !== plantId));
  };

  const sellBuds = (itemId: string) => {
    const item = buds.find(i => i.id === itemId);
    if (!item) return;

    const basePrice = item.isResearched 
      ? item.traits.yield * item.traits.potency * 10 
      : 50; // Unknown items sell for less
    
    const totalValue = basePrice * item.quantity;
    
    setGameStats(prev => ({ ...prev, money: prev.money + totalValue }));
    setBuds(prev => prev.filter(i => i.id !== itemId));
  };

  const convertBudsToSeeds = (itemId: string) => {
    const item = buds.find(i => i.id === itemId);
    if (!item || gameStats.money < 100) return;

    const newSeed: SeedItem = {
      id: Date.now().toString(),
      name: `${item.name} (семена)`,
      quantity: Math.floor(item.quantity / 2), // Seeds are fewer than harvest
      genetics: item.genetics,
      traits: item.traits,
      isKnownGenetics: item.isResearched,
      createdAt: gameTime
    };

    setSeeds(prev => [...prev, newSeed]);
    setBuds(prev => prev.filter(i => i.id !== itemId));
    setGameStats(prev => ({ ...prev, money: prev.money - 100 }));
  };

  const researchBuds = (itemId: string, labType: 'cheap' | 'premium') => {
    const item = buds.find(i => i.id === itemId);
    if (!item || item.isResearched) return;

    const cost = labType === 'cheap' ? 100 : 500;
    if (gameStats.money < cost) return;

    setBuds(prev => prev.map(i => 
      i.id === itemId ? { ...i, isResearched: true } : i
    ));
    setGameStats(prev => ({ 
      ...prev, 
      money: prev.money - cost,
      experimentsCount: prev.experimentsCount + 1
    }));
  };

  const sleepHours = (hours: number) => {
    setGameTime(prev => prev + hours * 60 * 60 * 1000);
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'seed': return 'Dot';
      case 'sprout': return 'Sprout';
      case 'vegetative': return 'TreePine';
      case 'flowering': return 'Flower';
      case 'harvest': return 'Star';
      default: return 'Dot';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'seed': return 'bg-gray-100';
      case 'sprout': return 'bg-plant-200';
      case 'vegetative': return 'bg-plant-400';
      case 'flowering': return 'bg-plant-600';
      case 'harvest': return 'bg-plant-800';
      default: return 'bg-gray-100';
    }
  };

  const renderTraitBar = (value: number, max = 10) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-plant-500 h-2 rounded-full" 
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-plant-50 to-plant-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-plant-800 mb-2">🌿 WeedGroove</h1>
          <p className="text-xl text-plant-600">Ферма будущего</p>
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="bg-plant-100 text-plant-800">
              💰 ${gameStats.money}
            </Badge>
            <Badge variant="secondary" className="bg-plant-100 text-plant-800">
              🌱 Собрано: {gameStats.totalHarvested}
            </Badge>
            <Badge variant="secondary" className="bg-plant-100 text-plant-800">
              🧬 Скрещено: {gameStats.crossbreedingAttempts}
            </Badge>
          </div>
        </header>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="farm">🌱 Ферма</TabsTrigger>
            <TabsTrigger value="inventory">📦 Инвентарь</TabsTrigger>
            <TabsTrigger value="genetics">🧬 Генетика</TabsTrigger>
            <TabsTrigger value="lab">🔬 Лаборатория</TabsTrigger>
            <TabsTrigger value="market">🏪 Магазин</TabsTrigger>
            <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="farm" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-plant-800">Твоя ферма</h2>
              <div className="flex gap-2">
                <Button onClick={() => sleepHours(6)} variant="outline">
                  😴 Поспать 6ч
                </Button>
                <Button onClick={() => sleepHours(12)} variant="outline">
                  💤 Поспать 12ч
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map(plant => (
                <Card key={plant.id} className={`transition-all duration-300 hover:scale-105 ${getStageColor(plant.stage)}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon name={getStageIcon(plant.stage)} size={20} />
                        {plant.name}
                      </span>
                      <Badge variant="secondary">
                        {plant.stage === 'seed' && '🌰 Семя'}
                        {plant.stage === 'sprout' && '🌱 Росток'}
                        {plant.stage === 'vegetative' && '🌿 Вегетация'}
                        {plant.stage === 'flowering' && '🌸 Цветение'}
                        {plant.stage === 'harvest' && '⭐ Урожай'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={plant.progress} className="mb-4" />
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">🌾 {plant.traits.yield}</div>
                        <div className="text-xs opacity-70">Урожай</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">⏱️ {plant.traits.speed}</div>
                        <div className="text-xs opacity-70">Скорость</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">💨 {plant.traits.potency}</div>
                        <div className="text-xs opacity-70">Крепость</div>
                      </div>
                    </div>
                    {plant.stage === 'harvest' && (
                      <Button 
                        onClick={() => harvestPlant(plant.id)}
                        className="w-full bg-plant-600 hover:bg-plant-700"
                      >
                        ✂️ Собрать урожай ({plant.traits.yield}г)
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-2 border-dashed border-plant-300 hover:border-plant-500 transition-colors">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Icon name="Plus" size={48} className="text-plant-400 mb-4" />
                  {seeds.length > 0 ? (
                    <Select onValueChange={(value) => plantSeed(value)} value="">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Посадить семена" />
                      </SelectTrigger>
                      <SelectContent>
                        {seeds.map(seed => (
                          <SelectItem key={seed.id} value={seed.id}>
                            {seed.name} ({seed.quantity} шт)
                            {seed.isKnownGenetics ? ' ✅' : ' ❓'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-center text-gray-500">
                      Купи семена в магазине для посадки
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-plant-800">Инвентарь</h2>
            </div>
            
            <Tabs value={inventoryTab} onValueChange={setInventoryTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buds">🌸 Шишки ({buds.length})</TabsTrigger>
                <TabsTrigger value="seeds">🌱 Семена ({seeds.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="buds" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buds.map(item => (
                    <Card key={item.id} className="relative group">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{item.name}</span>
                          <Badge variant={item.isResearched ? "default" : "secondary"}>
                            {item.quantity}г {item.isResearched ? '✅' : '❓'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {item.isResearched ? (
                          <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold">🌾 {item.traits.yield}</div>
                              <div className="text-xs opacity-70">Урожай</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">⏱️ {item.traits.speed}</div>
                              <div className="text-xs opacity-70">Скорость</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">💨 {item.traits.potency}</div>
                              <div className="text-xs opacity-70">Крепость</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center mb-4 text-gray-500">
                            ❓ Характеристики неизвестны
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Button 
                            onClick={() => sellBuds(item.id)}
                            variant="outline" 
                            className="w-full"
                          >
                            💰 Продать (${item.isResearched ? item.traits.yield * item.traits.potency * 10 * item.quantity : 50 * item.quantity})
                          </Button>
                          <Button 
                            onClick={() => convertBudsToSeeds(item.id)}
                            disabled={gameStats.money < 100}
                            variant="outline" 
                            className="w-full"
                          >
                            🌱 В семена ($100)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {buds.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      Нет шишек в инвентаре. Собери урожай!
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="seeds" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seeds.map(seed => (
                    <Card key={seed.id} className="relative group">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{seed.name}</span>
                          <Badge variant={seed.isKnownGenetics ? "default" : "secondary"}>
                            {seed.quantity} шт {seed.isKnownGenetics ? '✅' : '❓'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {seed.isKnownGenetics ? (
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">🌾 Урожай:</span>
                              <span className="text-sm font-medium">{seed.traits.yield}/10</span>
                            </div>
                            {renderTraitBar(seed.traits.yield)}
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">⏱️ Скорость:</span>
                              <span className="text-sm font-medium">{seed.traits.speed}/10</span>
                            </div>
                            {renderTraitBar(seed.traits.speed)}
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">💨 Крепость:</span>
                              <span className="text-sm font-medium">{seed.traits.potency}/10</span>
                            </div>
                            {renderTraitBar(seed.traits.potency)}
                          </div>
                        ) : (
                          <div className="text-center mb-4 text-gray-500">
                            ❓ Генетика неизвестна
                          </div>
                        )}
                        
                        <Button 
                          onClick={() => plantSeed(seed.id)}
                          className="w-full bg-plant-600 hover:bg-plant-700"
                        >
                          🌱 Посадить
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {seeds.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      Нет семян в инвентаре. Купи их в магазине!
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="genetics" className="space-y-6">
            <h2 className="text-2xl font-bold text-plant-800">🧬 Лаборатория скрещивания</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Скрещивание сортов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8 mb-6">
                  {/* Parent 1 Selection */}
                  <Card className={`p-6 border-2 transition-all cursor-pointer ${selectedSeed1 ? 'border-plant-500 bg-plant-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">🌱</div>
                      {selectedSeed1 ? (
                        <div>
                          <h3 className="font-semibold mb-2">{selectedSeed1.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">Количество: {selectedSeed1.quantity}</p>
                          {selectedSeed1.isKnownGenetics && (
                            <div className="space-y-1 text-sm">
                              <div>🌾 Урожай: {selectedSeed1.traits.yield}/10</div>
                              <div>⏱️ Скорость: {selectedSeed1.traits.speed}/10</div>
                              <div>💨 Крепость: {selectedSeed1.traits.potency}/10</div>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setSelectedSeed1(null)}
                          >
                            Убрать
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold mb-2">Родитель 1</h3>
                          <p className="text-sm text-gray-500 mb-3">Выбери семя</p>
                          <Select onValueChange={(value) => {
                            const seed = seeds.find(s => s.id === value);
                            if (seed) setSelectedSeed1(seed);
                          }} value="">
                            <SelectTrigger>
                              <SelectValue placeholder="Выбрать" />
                            </SelectTrigger>
                            <SelectContent>
                              {seeds.filter(s => s.quantity > 0).map(seed => (
                                <SelectItem key={seed.id} value={seed.id}>
                                  {seed.name} ({seed.quantity})
                                  {seed.isKnownGenetics ? ' ✅' : ' ❓'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Parent 2 Selection */}
                  <Card className={`p-6 border-2 transition-all cursor-pointer ${selectedSeed2 ? 'border-plant-500 bg-plant-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">🌱</div>
                      {selectedSeed2 ? (
                        <div>
                          <h3 className="font-semibold mb-2">{selectedSeed2.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">Количество: {selectedSeed2.quantity}</p>
                          {selectedSeed2.isKnownGenetics && (
                            <div className="space-y-1 text-sm">
                              <div>🌾 Урожай: {selectedSeed2.traits.yield}/10</div>
                              <div>⏱️ Скорость: {selectedSeed2.traits.speed}/10</div>
                              <div>💨 Крепость: {selectedSeed2.traits.potency}/10</div>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setSelectedSeed2(null)}
                          >
                            Убрать
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold mb-2">Родитель 2</h3>
                          <p className="text-sm text-gray-500 mb-3">Выбери семя</p>
                          <Select onValueChange={(value) => {
                            const seed = seeds.find(s => s.id === value);
                            if (seed) setSelectedSeed2(seed);
                          }} value="">
                            <SelectTrigger>
                              <SelectValue placeholder="Выбрать" />
                            </SelectTrigger>
                            <SelectContent>
                              {seeds.filter(s => s.quantity > 0 && s.id !== selectedSeed1?.id).map(seed => (
                                <SelectItem key={seed.id} value={seed.id}>
                                  {seed.name} ({seed.quantity})
                                  {seed.isKnownGenetics ? ' ✅' : ' ❓'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Crossbreeding Preview */}
                {selectedSeed1 && selectedSeed2 && (
                  <div className="bg-plant-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-3">Предварительный результат:</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium mb-1">🌾 Урожай</div>
                        {selectedSeed1.isKnownGenetics && selectedSeed2.isKnownGenetics ? (
                          <div className="text-sm">
                            {Math.min(getTraitRange(selectedSeed1.genetics.yield)[0], getTraitRange(selectedSeed2.genetics.yield)[0])} - 
                            {Math.max(getTraitRange(selectedSeed1.genetics.yield)[1], getTraitRange(selectedSeed2.genetics.yield)[1])}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">❓ Неизвестно</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">⏱️ Скорость</div>
                        {selectedSeed1.isKnownGenetics && selectedSeed2.isKnownGenetics ? (
                          <div className="text-sm">
                            {Math.min(getTraitRange(selectedSeed1.genetics.speed)[0], getTraitRange(selectedSeed2.genetics.speed)[0])} - 
                            {Math.max(getTraitRange(selectedSeed1.genetics.speed)[1], getTraitRange(selectedSeed2.genetics.speed)[1])}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">❓ Неизвестно</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">💨 Крепость</div>
                        {selectedSeed1.isKnownGenetics && selectedSeed2.isKnownGenetics ? (
                          <div className="text-sm">
                            {Math.min(getTraitRange(selectedSeed1.genetics.potency)[0], getTraitRange(selectedSeed2.genetics.potency)[0])} - 
                            {Math.max(getTraitRange(selectedSeed1.genetics.potency)[1], getTraitRange(selectedSeed2.genetics.potency)[1])}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">❓ Неизвестно</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-orange-600">
                      ⚠️ Шанс мутации: 10% для каждого гена
                    </div>
                  </div>
                )}

                <Button 
                  onClick={crossbreedSeeds}
                  disabled={!selectedSeed1 || !selectedSeed2}
                  className="w-full bg-plant-600 hover:bg-plant-700"
                >
                  🧬 Скрестить сорта
                </Button>
                
                {selectedSeed1 && selectedSeed2 && (
                  <div className="text-center text-sm text-gray-600 mt-2">
                    Результат: {generateHybridName(selectedSeed1.name, selectedSeed2.name)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab" className="space-y-6">
            <h2 className="text-2xl font-bold text-plant-800">🔬 Лаборатории</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">🔬 Базовая лаборатория</h3>
                <p className="text-sm text-gray-600 mb-3">Точное исследование характеристик</p>
                <Button variant="outline" className="w-full">$100</Button>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">⚗️ Премиум лаборатория</h3>
                <p className="text-sm text-gray-600 mb-3">Быстрые и детальные результаты</p>
                <Button variant="outline" className="w-full">$500</Button>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>🧪 Исследование образцов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buds.filter(item => !item.isResearched).map(item => (
                    <Card key={item.id} className="p-4">
                      <h3 className="font-semibold mb-2">{item.name}</h3>
                      <p className="text-sm mb-3">{item.quantity}г образца</p>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => researchBuds(item.id, 'cheap')}
                          disabled={gameStats.money < 100}
                          size="sm" 
                          className="w-full"
                        >
                          🔬 Исследовать ($100)
                        </Button>
                        <Button 
                          onClick={() => researchBuds(item.id, 'premium')}
                          disabled={gameStats.money < 500}
                          size="sm" 
                          variant="outline"
                          className="w-full"
                        >
                          ⚗️ Премиум ($500)
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {buds.filter(item => !item.isResearched).length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      Нет образцов для исследования
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🏪 Магазин семян</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeStrains.map(strain => (
                    <Card key={strain.name} className="p-4">
                      <h3 className="font-semibold mb-2">{strain.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{strain.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">🌾 Урожай:</span>
                          <span className="text-sm font-medium">{strain.traits.yield}/10</span>
                        </div>
                        {renderTraitBar(strain.traits.yield)}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">⏱️ Скорость:</span>
                          <span className="text-sm font-medium">{strain.traits.speed}/10</span>
                        </div>
                        {renderTraitBar(strain.traits.speed)}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">💨 Крепость:</span>
                          <span className="text-sm font-medium">{strain.traits.potency}/10</span>
                        </div>
                        {renderTraitBar(strain.traits.potency)}
                      </div>
                      
                      <Button 
                        onClick={() => buySeed(strain)}
                        disabled={gameStats.money < strain.price}
                        className="w-full"
                      >
                        Купить ${strain.price}
                      </Button>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">💰</div>
                <div className="text-2xl font-bold">${gameStats.money}</div>
                <div className="text-sm text-gray-600">Текущие деньги</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">🌱</div>
                <div className="text-2xl font-bold">{gameStats.totalHarvested}</div>
                <div className="text-sm text-gray-600">Всего собрано</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">🧬</div>
                <div className="text-2xl font-bold">{gameStats.crossbreedingAttempts}</div>
                <div className="text-sm text-gray-600">Гибридов создано</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">🔬</div>
                <div className="text-2xl font-bold">{gameStats.experimentsCount}</div>
                <div className="text-sm text-gray-600">Экспериментов</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WeedGroove;
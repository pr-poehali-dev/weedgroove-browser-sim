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

// Inventory items - harvested weed with unknown traits
interface HarvestItem {
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
  const [inventory, setInventory] = useState<HarvestItem[]>([]);
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
  const [gameTime, setGameTime] = useState(Date.now());
  const [selectedSeed1, setSelectedSeed1] = useState<string>('');
  const [selectedSeed2, setSelectedSeed2] = useState<string>('');

  // Load game state from localStorage
  useEffect(() => {
    const savedGame = localStorage.getItem('weedgroove-save');
    if (savedGame) {
      const data = JSON.parse(savedGame);
      setPlants(data.plants || []);
      setInventory(data.inventory || []);
      setSeeds(data.seeds || []);
      setGameStats(data.gameStats || gameStats);
      setGameTime(data.gameTime || Date.now());
    }
  }, []);

  // Save game state
  useEffect(() => {
    const gameData = {
      plants,
      inventory,
      seeds,
      gameStats,
      gameTime
    };
    localStorage.setItem('weedgroove-save', JSON.stringify(gameData));
  }, [plants, inventory, seeds, gameStats, gameTime]);

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

  // Generate random genetics
  const generateGenetics = (): PlantGenetics => ({
    yield: ['AA', 'Aa', 'aa'][Math.floor(Math.random() * 3)],
    speed: ['BB', 'Bb', 'bb'][Math.floor(Math.random() * 3)],
    potency: ['CC', 'Cc', 'cc'][Math.floor(Math.random() * 3)]
  });

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

  // Crossbreed two seeds to create a new unknown strain
  const crossbreedSeeds = (seedId1: string, seedId2: string) => {
    const seed1 = seeds.find(s => s.id === seedId1);
    const seed2 = seeds.find(s => s.id === seedId2);
    
    if (!seed1 || !seed2 || seed1.quantity < 1 || seed2.quantity < 1) return;

    // Create hybrid genetics
    const hybridGenetics: PlantGenetics = {
      yield: Math.random() < 0.5 ? seed1.genetics.yield : seed2.genetics.yield,
      speed: Math.random() < 0.5 ? seed1.genetics.speed : seed2.genetics.speed,
      potency: Math.random() < 0.5 ? seed1.genetics.potency : seed2.genetics.potency
    };

    // Add some random mutation chance
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
    
    const newSeed: SeedItem = {
      id: Date.now().toString(),
      name: `${seed1.name} × ${seed2.name} #${gameStats.crossbreedingAttempts + 1}`,
      quantity: 1,
      genetics: hybridGenetics,
      traits: hybridTraits,
      isKnownGenetics: false, // Player doesn't know the genetics!
      createdAt: gameTime
    };

    // Consume parent seeds
    setSeeds(prev => prev.map(seed => {
      if (seed.id === seedId1 || seed.id === seedId2) {
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

    setSelectedSeed1('');
    setSelectedSeed2('');
  };

  const plantSeed = (seedId?: string, strain?: string) => {
    if (seedId) {
      // Plant from seeds inventory
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
      
    } else if (strain) {
      // Buy and plant new seed from store
      if (gameStats.money < 50) return;
      
      const genetics = generateGenetics();
      const traits = calculateTraits(genetics);
      
      const newPlant: Plant = {
        id: Date.now().toString(),
        name: strain,
        stage: 'seed',
        progress: 0,
        genetics,
        traits,
        plantedAt: gameTime
      };
      
      setPlants(prev => [...prev, newPlant]);
      setGameStats(prev => ({ ...prev, money: prev.money - 50 }));
    }
  };

  const harvestPlant = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant || plant.stage !== 'harvest') return;
    
    // Add to inventory (traits hidden!)
    const harvestItem: HarvestItem = {
      id: Date.now().toString(),
      name: plant.name,
      quantity: plant.traits.yield,
      genetics: plant.genetics,
      traits: plant.traits,
      isResearched: false,
      harvestedAt: gameTime
    };

    setInventory(prev => {
      const existing = prev.find(item => item.name === plant.name && !item.isResearched);
      if (existing) {
        return prev.map(item => 
          item.id === existing.id 
            ? { ...item, quantity: item.quantity + plant.traits.yield }
            : item
        );
      }
      return [...prev, harvestItem];
    });
    
    setGameStats(prev => ({
      ...prev,
      totalHarvested: prev.totalHarvested + 1,
      bestYield: Math.max(prev.bestYield, plant.traits.yield),
      bestPotency: Math.max(prev.bestPotency, plant.traits.potency)
    }));
    
    setPlants(prev => prev.filter(p => p.id !== plantId));
  };

  const sellHarvest = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const basePrice = item.isResearched 
      ? item.traits.yield * item.traits.potency * 10 
      : 50; // Unknown items sell for less
    
    const totalValue = basePrice * item.quantity;
    
    setGameStats(prev => ({ ...prev, money: prev.money + totalValue }));
    setInventory(prev => prev.filter(i => i.id !== itemId));
  };

  const convertToSeeds = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
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
    setInventory(prev => prev.filter(i => i.id !== itemId));
    setGameStats(prev => ({ ...prev, money: prev.money - 100 }));
  };

  const researchItem = (itemId: string, labType: 'cheap' | 'premium') => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.isResearched) return;

    const cost = labType === 'cheap' ? 100 : 500;
    if (gameStats.money < cost) return;

    setInventory(prev => prev.map(i => 
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
                  <Button 
                    onClick={() => plantSeed(undefined, 'Случайный сорт')}
                    disabled={gameStats.money < 50}
                    className="bg-plant-500 hover:bg-plant-600 mb-2"
                  >
                    🌱 Купить семя ($50)
                  </Button>
                  {seeds.length > 0 && (
                    <Select onValueChange={(value) => plantSeed(value)} value="">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Посадить свои семена" />
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
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <h2 className="text-2xl font-bold text-plant-800">Инвентарь урожая</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map(item => (
                <Card key={item.id} className="relative">
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
                        onClick={() => sellHarvest(item.id)}
                        variant="outline" 
                        className="w-full"
                      >
                        💰 Продать (${item.isResearched ? item.traits.yield * item.traits.potency * 10 * item.quantity : 50 * item.quantity})
                      </Button>
                      <Button 
                        onClick={() => convertToSeeds(item.id)}
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
            </div>
          </TabsContent>

          <TabsContent value="genetics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🧬 Скрещивание сортов</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Родитель 1:</label>
                      <Select value={selectedSeed1} onValueChange={setSelectedSeed1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выбери семя" />
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
                    <div>
                      <label className="text-sm font-medium mb-2 block">Родитель 2:</label>
                      <Select value={selectedSeed2} onValueChange={setSelectedSeed2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выбери семя" />
                        </SelectTrigger>
                        <SelectContent>
                          {seeds.filter(s => s.quantity > 0 && s.id !== selectedSeed1).map(seed => (
                            <SelectItem key={seed.id} value={seed.id}>
                              {seed.name} ({seed.quantity})
                              {seed.isKnownGenetics ? ' ✅' : ' ❓'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => crossbreedSeeds(selectedSeed1, selectedSeed2)}
                    disabled={!selectedSeed1 || !selectedSeed2}
                    className="w-full bg-plant-600 hover:bg-plant-700"
                  >
                    🧬 Скрестить сорта
                  </Button>
                  
                  <div className="text-sm text-gray-600 bg-plant-50 p-3 rounded">
                    ⚠️ Результат скрещивания непредсказуем! Характеристики гибрида будут неизвестны до исследования.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📚 Генетика 101</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-plant-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Как работает генетика:</h3>
                      <ul className="space-y-1 text-sm">
                        <li><strong>AA, BB, CC</strong> - доминантные гены (8-10 баллов)</li>
                        <li><strong>Aa, Bb, Cc</strong> - гибридные гены (5-7 баллов)</li>
                        <li><strong>aa, bb, cc</strong> - рецессивные гены (2-4 балла)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold mb-2">🔬 Мутации:</h3>
                      <p className="text-sm">При скрещивании есть 10% шанс мутации каждого гена!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>🌱 Банк семян</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seeds.map(seed => (
                    <Card key={seed.id} className="p-4">
                      <h3 className="font-semibold mb-2">{seed.name}</h3>
                      <p className="text-sm mb-2">Количество: {seed.quantity}</p>
                      {seed.isKnownGenetics ? (
                        <div className="text-xs space-y-1">
                          <div>Урожай: {seed.genetics.yield} ({seed.traits.yield}/10)</div>
                          <div>Скорость: {seed.genetics.speed} ({seed.traits.speed}/10)</div>
                          <div>Крепость: {seed.genetics.potency} ({seed.traits.potency}/10)</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">❓ Генетика неизвестна</div>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab" className="space-y-6">
            <h2 className="text-2xl font-bold text-plant-800">🔬 Лаборатории</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">🚬 Прямое тестирование</h3>
                <p className="text-sm text-gray-600 mb-3">Дешево, но неточно (±50%)</p>
                <Button variant="outline" className="w-full">Скоро...</Button>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">🔬 Дешевая лаборатория</h3>
                <p className="text-sm text-gray-600 mb-3">Точные характеристики</p>
                <Button variant="outline" className="w-full">$100</Button>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">⚗️ Премиум лаборатория</h3>
                <p className="text-sm text-gray-600 mb-3">Быстрые и точные результаты</p>
                <Button variant="outline" className="w-full">$500</Button>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>🧪 Исследование образцов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.filter(item => !item.isResearched).map(item => (
                    <Card key={item.id} className="p-4">
                      <h3 className="font-semibold mb-2">{item.name}</h3>
                      <p className="text-sm mb-3">{item.quantity}г образца</p>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => researchItem(item.id, 'cheap')}
                          disabled={gameStats.money < 100}
                          size="sm" 
                          className="w-full"
                        >
                          🔬 Исследовать ($100)
                        </Button>
                        <Button 
                          onClick={() => researchItem(item.id, 'premium')}
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
                  {inventory.filter(item => !item.isResearched).length === 0 && (
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
                  {['Indica Classic', 'Sativa Power', 'Hybrid Dream', 'Auto Flower', 'CBD Special', 'THC Monster'].map(strain => (
                    <Card key={strain} className="p-4">
                      <h3 className="font-semibold mb-2">{strain}</h3>
                      <p className="text-sm text-gray-600 mb-3">Случайная генетика ✅ Известные характеристики</p>
                      <Button 
                        onClick={() => plantSeed(undefined, strain)}
                        disabled={gameStats.money < 50}
                        className="w-full"
                      >
                        Купить и посадить $50
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
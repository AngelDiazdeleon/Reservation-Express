class TerraceController {
    constructor(TerraceModel, imageService) {
        this.TerraceModel = TerraceModel;
        this.imageService = imageService;
    }

    async createTerrace(req, res) {
        try {
            const { name, description } = req.body;
            const images = req.files; // Assuming multiple images are uploaded

            const imageUrls = await Promise.all(images.map(image => this.imageService.uploadImage(image)));

            const newTerrace = new this.TerraceModel({
                name,
                description,
                images: imageUrls
            });

            await newTerrace.save();
            res.status(201).json(newTerrace);
        } catch (error) {
            res.status(500).json({ message: 'Error creating terrace', error });
        }
    }

    async getTerraces(req, res) {
        try {
            const terraces = await this.TerraceModel.find();
            res.status(200).json(terraces);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching terraces', error });
        }
    }

    async getTerraceById(req, res) {
        try {
            const { id } = req.params;
            const terrace = await this.TerraceModel.findById(id);
            if (!terrace) {
                return res.status(404).json({ message: 'Terrace not found' });
            }
            res.status(200).json(terrace);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching terrace', error });
        }
    }

    async updateTerrace(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if (req.files) {
                const images = req.files;
                const imageUrls = await Promise.all(images.map(image => this.imageService.uploadImage(image)));
                updates.images = imageUrls;
            }

            const updatedTerrace = await this.TerraceModel.findByIdAndUpdate(id, updates, { new: true });
            if (!updatedTerrace) {
                return res.status(404).json({ message: 'Terrace not found' });
            }
            res.status(200).json(updatedTerrace);
        } catch (error) {
            res.status(500).json({ message: 'Error updating terrace', error });
        }
    }

    async deleteTerrace(req, res) {
        try {
            const { id } = req.params;
            const deletedTerrace = await this.TerraceModel.findByIdAndDelete(id);
            if (!deletedTerrace) {
                return res.status(404).json({ message: 'Terrace not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting terrace', error });
        }
    }
}

export default TerraceController;
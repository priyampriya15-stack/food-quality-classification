"""EfficientNetB0 Transfer Learning Architecture for Food Quality Classification.

Builds an EfficientNetB0 transfer learning model using ImageNet pretrained weights,
with a custom classification head and support for stage-wise fine-tuning.
"""

import logging
from typing import Optional, Tuple
import tensorflow as tf

DEFAULT_INPUT_SHAPE: Tuple[int, int, int] = (224, 224, 3)
DEFAULT_NUM_CLASSES: int = 2

logger = logging.getLogger("efficientnet_model")


def build_efficientnet_model(
    input_shape: Tuple[int, int, int] = DEFAULT_INPUT_SHAPE,
    num_classes: int = DEFAULT_NUM_CLASSES,
    learning_rate: float = 1e-3,
    dropout_rate: float = 0.3,
    use_pretrained_weights: bool = True,
    model_name: str = "efficientnet_b0",
) -> Tuple[tf.keras.Model, bool]:
    """Build, assemble, and compile the EfficientNetB0 transfer learning classifier.
    
    Args:
        input_shape: Expected RGB image dimensions (224, 224, 3).
        num_classes: Number of target quality classes (2 for Fresh and Spoiled).
        learning_rate: Initial learning rate for Adam optimizer.
        dropout_rate: Dropout rate for dense classification head.
        use_pretrained_weights: Whether to download/load ImageNet weights.
        model_name: Name identifier for the Keras model.
        
    Returns:
        (compiled_model, pretrained_weights_loaded_boolean)
        
    Raises:
        RuntimeError: If pretrained weights are requested but cannot be downloaded/loaded.
    """
    weights_setting: Optional[str] = "imagenet" if use_pretrained_weights else None
    pretrained_loaded: bool = False

    logger.info(f"Initializing EfficientNetB0 base (weights={weights_setting})...")

    try:
        base_model = tf.keras.applications.EfficientNetB0(
            include_top=False,
            weights=weights_setting,
            input_shape=input_shape,
            pooling=None,
        )
        if use_pretrained_weights:
            pretrained_loaded = True
            logger.info("Successfully loaded official ImageNet pretrained weights for EfficientNetB0.")
        else:
            logger.info("Initialized EfficientNetB0 with uninitialized weights (scratch training).")
    except Exception as e:
        if use_pretrained_weights:
            err_msg = (
                f"Failed to load ImageNet pretrained weights for EfficientNetB0: {e}. "
                "Offline execution or network blocking prevented downloading pretrained weights. "
                "Per project rules, random weights will not be silently substituted. "
                "Ensure internet connectivity or explicitly pass --no-pretrained to train from scratch."
            )
            logger.error(err_msg)
            raise RuntimeError(err_msg) from e
        else:
            raise

    # Freeze base model during feature extraction phase
    base_model.trainable = False

    inputs = tf.keras.Input(shape=input_shape, name="food_image_input")

    # EfficientNet preprocessing: ensures appropriate scaling and centering
    # EfficientNet in tf.keras has built-in preprocessing or expects raw [0, 255] pixels
    try:
        x = tf.keras.applications.efficientnet.preprocess_input(inputs)
    except Exception:
        # Fallback if preprocess_input layer not directly callable as Keras symbolic tensor
        x = tf.keras.layers.Lambda(
            tf.keras.applications.efficientnet.preprocess_input,
            name="efficientnet_preproc",
        )(inputs)

    # Feature extraction through frozen base
    x = base_model(x, training=False)

    # Classification head
    x = tf.keras.layers.GlobalAveragePooling2D(name="gap")(x)
    x = tf.keras.layers.BatchNormalization(name="head_bn1")(x)
    x = tf.keras.layers.Dropout(dropout_rate, name="head_dropout1")(x)
    x = tf.keras.layers.Dense(128, activation="relu", name="head_dense")(x)
    x = tf.keras.layers.BatchNormalization(name="head_bn2")(x)
    x = tf.keras.layers.Dropout(0.2, name="head_dropout2")(x)

    outputs = tf.keras.layers.Dense(
        num_classes,
        activation="softmax",
        name="quality_probabilities",
    )(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name=model_name)

    # Compile with Adam and sparse categorical crossentropy
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    return model, pretrained_loaded


def unfreeze_for_fine_tuning(
    model: tf.keras.Model,
    num_layers_to_unfreeze: int = 20,
    fine_tune_lr: float = 1e-5,
) -> tf.keras.Model:
    """Unfreeze top layers of the EfficientNet base model for delicate fine-tuning.
    
    Keeps BatchNormalization layers frozen to maintain stable running statistics.
    Re-compiles the model with a smaller learning rate.
    """
    logger.info(f"Unfreezing top {num_layers_to_unfreeze} layers of EfficientNet base for fine-tuning...")

    # Locate the EfficientNet sub-model layer
    base_model = None
    for layer in model.layers:
        if "efficientnet" in layer.name.lower():
            base_model = layer
            break

    if base_model is None:
        logger.warning("Could not find EfficientNet sub-model layer to unfreeze.")
        return model

    # Unfreeze the base model
    base_model.trainable = True

    # Freeze all lower layers, leave only top N layers trainable
    total_layers = len(base_model.layers)
    freeze_until = max(0, total_layers - num_layers_to_unfreeze)

    for i, layer in enumerate(base_model.layers):
        if i < freeze_until:
            layer.trainable = False
        else:
            # BatchNormalization layers should remain frozen in fine-tuning
            if isinstance(layer, tf.keras.layers.BatchNormalization):
                layer.trainable = False
            else:
                layer.trainable = True

    # Recompile with smaller learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=fine_tune_lr),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    trainable_count = sum(tf.keras.backend.count_params(w) for w in model.trainable_weights)
    logger.info(f"Model recompiled for fine-tuning. Trainable parameters: {trainable_count:,}")

    return model
